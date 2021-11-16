const express = require('express');
const app = express();

const json2html = require('json-to-html');

const { Datastore } = require('@google-cloud/datastore');

const bodyParser = require('body-parser');
const request = require('request');

const datastore = new Datastore();

const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const BOAT = "Boat";

const router = express.Router();
const login = express.Router();
const owner = express.Router();

const CLIENT_ID = 'LNjMPnuvPFVQPsi2UZvCI4lhSZJobVDh';
const CLIENT_SECRET = 'Smhe7JUl2seg75Xc5H6RMvc9q4u8QfKzjxNwGP3HYpFVaV21EILYlfJ4XGGTQ-Xb';
const DOMAIN = 'cs493-nate.us.auth0.com';

app.use(bodyParser.json());

function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
}

function useJwt() {
    return jwt({
        secret: jwksRsa.expressJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri: `https://${DOMAIN}/.well-known/jwks.json`
        }),

        // Validate the audience and the issuer.
        issuer: `https://${DOMAIN}/`,
        algorithms: ['RS256']
    });
}

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${DOMAIN}/.well-known/jwks.json`
    }),

    // Validate the audience and the issuer.
    issuer: `https://${DOMAIN}/`,
    algorithms: ['RS256']
});

/* ------------- Begin Lodging Model Functions ------------- */
function post_boat(name, type, length, public, owner) {
    var key = datastore.key(BOAT);
    const new_boat = { "name": name, "type": type, "length": length, "public": public, "owner": owner };
    return datastore.save({ "key": key, "data": new_boat }).then(() => { return key });
}

function get_boats(owner) {
    const q = datastore.createQuery(BOAT);
    return datastore.runQuery(q).then((entities) => {
        return entities[0].map(fromDatastore).filter(item => item.owner === owner);
    });
}

function get_boats_unprotected() {
    const q = datastore.createQuery(BOAT);
    return datastore.runQuery(q).then((entities) => {
        return entities[0].map(fromDatastore);
    });
}

function get_lodging(id, owner) {
    const key = datastore.key([LODGING, parseInt(id, 10)]);
    return datastore.get(key).then((data) => {
        return fromDatastore(data[0]);
    }
    );
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */



router.get('/', checkJwt, function (req, res) {

    console.log('jwt' + req.user);
    console.log(JSON.stringify(req.user));
    const boats = get_boats(req.user.sub)
        .then((boats) => {
            res.status(200).json(boats);
        });
});



router.get('/unsecure', function (req, res) {
    const boats = get_boats_unprotected()
        .then((boats) => {
            res.status(200).json(boats);
        });
});

owner.get('/:owner_id/boats', function (req, res) {
    const owner = req.params.owner_id
    const boatArr = []
    console.log(owner)
    const boats = get_boats_unprotected(owner)
        .then((boats) => {
            for (boat = 0; boat < boats.length; boat++) {
                if (boats[boat].owner === owner && boats[boat].public) {
                    boatArr.push(boats[boat])
                    console.log(boatArr)
                }
            }
            res.status(200).json(boatArr)
        });
})
    ;

router.post('/', checkJwt, function (req, res) {
    if (req.get('content-type') !== 'application/json') {
        res.status(415).send('Server only accepts application/json data.')
    }
    post_boat(req.body.name, req.body.type, req.body.length, req.body.public, req.user.sub)
        .then(key => {
            res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
            res.status(201).send('{ "id": ' + key.id + ' }')
        });
});

login.post('/', function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    var options = {
        method: 'POST',
        url: `https://${DOMAIN}/oauth/token`,
        headers: { 'content-type': 'application/json' },
        body:
        {
            grant_type: 'password',
            username: username,
            password: password,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
        },
        json: true
    };
    request(options, (error, response, body) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(body);
        }
    });

});

/* ------------- End Controller Functions ------------- */
app.use('/owners', owner);
app.use('/boats', router);
app.use('/login', login);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});