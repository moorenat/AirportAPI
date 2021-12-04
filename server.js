const express = require('express');
const app = express();

const json2html = require('json-to-html');

const { Datastore } = require('@google-cloud/datastore');

const bodyParser = require('body-parser');
const request = require('request');

const datastore = new Datastore();

const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const PILOT = "Pilot";

const router = express.Router();
const login = express.Router();
const owner = express.Router();
const callback = express.Router();

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
function post_pilot(name, type, length, public, owner) {
    var key = datastore.key(PILOT);
    const new_pilot = { "name": name, "type": type, "length": length, "public": public, "owner": owner };
    return datastore.save({ "key": key, "data": new_pilot }).then(() => { return key });
}

function get_pilots(owner) {
    const q = datastore.createQuery(PILOT);
    return datastore.runQuery(q).then((entities) => {
        return entities[0].map(fromDatastore).filter(item => item.owner === owner);
    });
}

function get_pilots_unprotected() {
    const q = datastore.createQuery(PILOT);
    return datastore.runQuery(q).then((entities) => {
        return entities[0].map(fromDatastore);
    });
}
function get_pilot(id) {
    const key = datastore.key([PILOT, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            // No entity found. Don't try to add the id attribute
            return entity;
        } else {
            // Use Array.map to call the function fromDatastore. This function
            // adds id attribute to every element in the array entity
            return entity.map(fromDatastore);
        }
    });
}
function delete_pilot(id) {
    const key = datastore.key([PILOT, parseInt(id, 10)]);
    return datastore.delete(key);
}


/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

router.delete('/:pilot_id', checkJwt, function (req, res) {
    const pilot_id = req.params.pilot_id
    const owner = req.user.sub

    const pilot = get_pilot(pilot_id).then((pilot) => {
        if (pilot[0] === undefined || pilot[0] === null) {
            res.status(403).send('one').end()
        }
        else if (pilot[0].owner === owner) {
            delete_pilot(pilot_id).then(res.status(204).end())
        }
        else {
            res.status(403).send('2').end()
        }
    })

})

callback.get('/', function (req, res) {



})

router.get('/', checkJwt, function (req, res) {

    console.log('jwt' + req.user);
    console.log(JSON.stringify(req.user));
    const pilots = get_pilots(req.user.sub)
        .then((pilots) => {
            res.status(200).json(pilots);
        });
});



router.get('/unsecure', function (req, res) {
    const pilots = get_pilots_unprotected()
        .then((pilots) => {
            res.status(200).json(pilots);
        });
});

owner.get('/:owner_id/pilots', function (req, res) {
    const owner = req.params.owner_id
    const pilotArr = []
    console.log(owner)
    const pilots = get_pilots_unprotected(owner)
        .then((pilots) => {
            for (pilot = 0; pilot < pilots.length; pilot++) {
                if (pilots[pilot].owner === owner && pilots[pilot].public) {
                    pilotArr.push(pilots[pilot])
                    console.log(pilotArr)
                }
            }
            res.status(200).json(pilotArr)
        });
})
    ;

router.post('/', checkJwt, function (req, res) {
    if (req.get('content-type') !== 'application/json') {
        res.status(415).send('Server only accepts application/json data.')
    }
    post_pilot(req.body.name, req.body.type, req.body.length, req.body.public, req.user.sub)
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
app.use('/pilots', router);
app.use('/login', login);
app.use('/callback', callback);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});