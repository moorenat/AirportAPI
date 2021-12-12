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
const PLANE = "Plane";
const HANGER = "Hanger";


const router = express.Router();
const login = express.Router();
const user = express.Router();
const plane = express.Router();
const hanger = express.Router();

const CLIENT_ID = 'LNjMPnuvPFVQPsi2UZvCI4lhSZJobVDh';
const CLIENT_SECRET = 'Smhe7JUl2seg75Xc5H6RMvc9q4u8QfKzjxNwGP3HYpFVaV21EILYlfJ4XGGTQ-Xb';
const DOMAIN = 'cs493-nate.us.auth0.com';

app.use(bodyParser.json());

function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
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

//datastore functions for pilots:

function post_pilot(name, sub) {
    var key = datastore.key(PILOT);
    const new_pilot = { "name": name, "sub": sub };
    return datastore.save({ "key": key, "data": new_pilot }).then(() => { return key });
}

function get_pilots(sub) {
    const q = datastore.createQuery(PILOT);
    return datastore.runQuery(q).then((entities) => {
        return entities[0].map(fromDatastore).filter(item => item.sub === sub);
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

// Datastore Functions for planes:

function post_plane(pilot, hanger_id, manufacturer, tailNo, color) {
    var key = datastore.key(PLANE);
    const new_plane = { "pilot": pilot, "hanger_id": hanger_id, "manufacturer": manufacturer, "tailNo": tailNo, "color": color };
    return datastore.save({ "key": key, "data": new_plane }).then(() => { return key });
}

function get_plane(id) {
    const key = datastore.key([PLANE, parseInt(id, 10)]);
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

function get_planes_unprotected() {
    const q = datastore.createQuery(PLANE);
    return datastore.runQuery(q).then((entities) => {
        return entities[0].map(fromDatastore);
    });
}
function get_planes(pilot) {
    const q = datastore.createQuery(PLANE);
    return datastore.runQuery(q).then((entities) => {
        return entities[0].map(fromDatastore).filter(item => item.pilot === pilot);
    });
}

function patch_plane(id, pilot, hanger_id, manufacturer, tailNo, color, self) {
    const key = datastore.key([PLANE, parseInt(id, 10)]);
    const plane = { "pilot": pilot, "hanger_id": hanger_id, "manufacturer": manufacturer, "tailNo": tailNo, "color": color, "self": self };
    return datastore.save({ "key": key, "data": plane });
}

function delete_plane(id) {
    const key = datastore.key([PLANE, parseInt(id, 10)]);
    return datastore.delete(key);
}

function get_plane_hanger(hanger_id) {
    const q = datastore.createQuery(PLANE);
    return datastore.runQuery(q).then((entities) => {
        return entities[0].map(fromDatastore).filter(item => item.hanger_id === hanger_id);
    });
}

// datastore functions for hangers

function post_hanger(name, runway, type) {
    var key = datastore.key(HANGER);
    const new_hanger = { "name": name, "plane_id": null, "runway": runway, "type": type };
    return datastore.save({ "key": key, "data": new_hanger }).then(() => { return key });
}
function get_hanger(id) {
    const key = datastore.key([HANGER, parseInt(id, 10)]);
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

function get_hangers() {
    const q = datastore.createQuery(HANGER);
    return datastore.runQuery(q).then((entities) => {
        return entities[0].map(fromDatastore);
    });
}

function patch_hanger(id, name, plane_id, runway, type, self) {
    const key = datastore.key([HANGER, parseInt(id, 10)]);
    const hanger = { "name": name, "plane_id": plane_id, "runway": runway, "type": type, "self": self };
    return datastore.save({ "key": key, "data": hanger });
}

function delete_hanger(id) {
    const key = datastore.key([HANGER, parseInt(id, 10)]);
    return datastore.delete(key);
}

function get_hanger_plane(plane_id) {
    const q = datastore.createQuery(HANGER);
    return datastore.runQuery(q).then((entities) => {
        return entities[0].map(fromDatastore).filter(item => item.plane_id === plane_id);
    });
}

function set_hanger_plane(id, plane_id) {
    const key = datastore.key([HANGER, parseInt(id, 10)]);
    const hanger = { "plane_id": plane_id };
    return datastore.save({ "key": key, "data": hanger });
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

//pilot controller functions:

router.delete('/:pilot_id', checkJwt, function (req, res) {
    const pilot_id = req.params.pilot_id
    const sub = req.user.sub

    const pilot = get_pilot(pilot_id).then((pilot) => {
        if (pilot[0] === undefined || pilot[0] === null) {
            res.status(404).json({ 'Error': 'Pilot not found' })
        }
        else if (pilot[0].sub === sub) {
            delete_pilot(pilot_id).then(res.status(204).end())
        }
        else {
            res.status(403).json({ 'Error': 'Forbidden' })
        }
    })
})

router.get('/', checkJwt, function (req, res) {

    console.log('jwt' + req.user);
    console.log(JSON.stringify(req.user));
    const pilots = get_pilots(req.user.sub)
        .then((pilots) => {
            res.status(200).json(pilots);
        });
});

router.post('/', checkJwt, function (req, res) {
    if (req.get('content-type') !== 'application/json') {
        res.status(415).json({ 'Error': 'Server only accepts application/json data.' })
    }
    post_pilot(req.body.name, req.user.sub)
        .then(key => {
            res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
            res.status(201).send('{ "id": ' + key.id + ' }')
        });
});
router.put('/', function (req, res) {
    res.set('Accept', 'GET, POST, DELETE');
    res.status(405).json({ 'Error': '/pilots only alows GET, POST, DELETE' });
});
router.patch('/', function (req, res) {
    res.set('Accept', 'GET, POST, DELETE');
    res.status(405).json({ 'Error': '/pilots only alows GET, POST, DELETE' });
});
router.delete('/', function (req, res) {
    res.set('Accept', 'GET, POST, DELETE');
    res.status(405).json({ 'Error': '/pilots only alows GET, POST, DELETE' });
});


// plane controler functions:

plane.get('/', checkJwt, async function (req, res) {
    const pilot = req.user.sub
    let planes = await get_planes(pilot)
    if (planes[0] === undefined || planes[0] === null) {
        res.status(404).json({ 'Error': 'No planes exist for this pilot' })
    }
    else {
        res.status(200).json(planes)
    }
})

plane.get('/unsecure', async function (req, res) {
    const accepts = req.accepts('application/json')
    if (!accepts) {
        res.status(406).json({ 'Error': 'accept header must be application/json' })
    }
    else {
        const planes = await get_planes_unprotected()
        res.status(200).json(planes)
    }
})

plane.delete('/', function (req, res) {
    res.set('Accept', 'GET, POST, PATCH');
    res.status(405).json({ "Error": "Route only accetps GET, POST, PATCH. To Delete use /planes/:plane_id" })

})

plane.delete('/:plane_id', checkJwt, async function (req, res) {
    const pilot = req.user.sub
    const plane_id = req.params.plane_id

    let plane = await get_plane(plane_id)
    let hanger = await get_hanger_plane(plane_id)

    if (plane[0] === undefined || plane[0] === null) {
        res.status(404).json({ 'Error': 'No plane found with this id' })
    }
    else if (plane[0].pilot === pilot) {

        hanger = hanger[0]
        await patch_hanger(hanger.id, hanger.name, null, hanger.runway, hanger.type, hanger.self)

        delete_plane(plane_id).then(res.status(204).end())
    }
    else {
        res.status(403).json({ 'Error': 'Forbidden' })
    }

})

plane.patch('/:plane_id', checkJwt, async function (req, res) {
    const plane_id = req.params.plane_id
    const pilot = req.user.sub

    let plane = await get_plane(plane_id)



    if (plane[0] === undefined || plane[0] === null) {
        res.status(404).json({ 'Error': 'Plane not found' })
    }

    else if (plane[0].pilot === pilot) {
        let { hanger_id, manufacturer, tailNo, color } = req.body
        if (req.get('content-type') !== 'application/json') {
            res.status(415).send('Server only accepts application/json data.')
        }

        else if (!hanger_id && !manufacturer && !tailNo && !color) {
            return res.status(400).json({
                Error: "The request object is missing at least one of the required attributes"
            })
        }
        else if (Object.keys(req.body).length > 4) {
            return res.status(400).json({
                "Error": 'There are too many attributes in request'
            })
        }
        else {
            let hanger = await get_hanger(plane[0].hanger_id)

            hanger = hanger[0]
            console.log(hanger)
            if (hanger === undefined || hanger === null) {
                res.status(404).json({ "Error": "Hanger not found" })
            }

            else {
                await patch_hanger(hanger.id, hanger.name, plane_id, hanger.runway, hanger.type, hanger.self)
                plane = plane[0]
                updatedPlane = Object.assign(plane, req.body)
                planePatch = await patch_plane(plane_id, pilot, plane.hanger_id, plane.manufacturer, plane.tailNo, plane.color, plane.self)
                res.status(200).json(plane)
            }

        }
    }
    else {
        res.status(403).json({ 'Error': 'Forbidden' })
    }
});

plane.get('/:plane_id', checkJwt, async function (req, res) {
    const plane_id = req.params.plane_id
    const pilot = req.user.sub

    const plane = await get_plane(plane_id)
    if (plane[0] === undefined || plane[0] === null) {
        res.status(404).json({ 'Error': 'Plane not found' })
    }
    else if (plane[0].pilot === pilot) {
        res.status(200).json(plane[0])
    }
    else {
        res.status(403).json({ 'Error': 'Forbidden' })
    }
})

plane.post('/', checkJwt, async function (req, res) {

    if (req.get('content-type') !== 'application/json') {
        res.status(415).json({ 'Error': 'Server only accepts application/json data' })
    }
    else {
        let plane = await post_plane(req.user.sub, req.body.hanger_id, req.body.manufacturer, req.body.tailNo, req.body.color)
        let hanger = await get_hanger(req.body.hanger_id)

        if (hanger[0] === undefined || hanger[0] === null) {
            res.status(404).json({ 'Error': 'Hanger not found' })
        }

        else if (hanger[0].plane_id != null) {
            res.status(403).json({ 'Error': "Hanger is already occupied" })
        }
        else {
            hanger = hanger[0]
            await patch_hanger(req.body.hanger_id, hanger.name, plane.id, hanger.runway, hanger.type, hanger.self)
        }

        let url = req.protocol + "://" + req.get("host") + "/planes/" + plane.id
        let output = { "id": plane.id, "pilot": req.user.sub, "hanger_id": req.body.hanger_id, "manufacturer": req.body.manufacturer, "tailNo": req.body.tailNo, "color": req.body.color, "self": url }
        await patch_plane(plane.id, req.user.sub, req.body.hanger_id, req.body.manufacturer, req.body.tailNo, req.body.color, url)
        res.status(201).json(output)
    }

})

//hanger controller functions:

hanger.post('/', async function (req, res) {

    if (req.get('content-type') !== 'application/json') {
        res.status(415).json({ 'Error': 'Server only accepts application/json data' })
    }
    else {
        const hanger = await post_hanger(req.body.name, req.body.runway, req.body.type)
        let url = req.protocol + "://" + req.get("host") + "/hangers/" + hanger.id
        let output = { "id": hanger.id, "name": req.body.name, "plane_id": null, "runway": req.body.runway, "type": req.body.type, "self": url }
        const hangerUpdate = await patch_hanger(hanger.id, req.body.name, null, req.body.runway, req.body.type, url)
        res.status(201).json(output)
    }
});

hanger.get('/', async function (req, res) {
    const accepts = req.accepts('application/json')
    if (!accepts) {
        res.status(406).json({ 'Error': 'accept header must be application/json' })
    }
    else {
        const hangers = await get_hangers()
        res.status(200).json(hangers)
    }
});

hanger.get('/:hanger_id', async function (req, res) {
    const hanger_id = req.params.hanger_id

    const hanger = await get_hanger(hanger_id)
    if (hanger[0] === undefined || hanger[0] === null) {
        res.status(404).json({ 'Error': 'Hanger not found' })
    }
    else {
        res.status(200).json(hanger[0])
    }
});

hanger.patch('/:hanger_id', async function (req, res) {
    const hanger_id = req.params.hanger_id

    let hanger = await get_hanger(hanger_id)

    if (hanger[0] === undefined || hanger[0] === null) {
        res.status(404).json({ 'Error': 'Hanger not found' })
    }
    else {
        let { name, runway, type } = req.body
        if (req.get('content-type') !== 'application/json') {
            res.status(415).send('Server only accepts application/json data.')
        }

        else if (!name && !runway && !type) {
            return res.status(400).json({
                Error: "The request object is missing at least one of the required attributes"
            })
        }

        else {
            hanger = hanger[0]
            updatedHanger = Object.assign(hanger, req.body)
            hangerPatch = await patch_hanger(hanger_id, hanger.name, hanger.plane_id, hanger.runway, hanger.type, hanger.self)
            res.status(200).json(hanger)
        }
    }
});

hanger.delete('/:hanger_id', async function (req, res) {
    const hanger_id = req.params.hanger_id

    let hanger = await get_hanger(hanger_id)
    let plane = await get_plane_hanger(hanger_id)

    if (hanger[0] === undefined || hanger[0] === null) {
        res.status(404).json({ 'Error': 'No hanger found with this id' })
    }
    else if (hanger[0].plane_id != null) {
        res.status(403).json({ "Error": "Cannot delete hanger while occupied" })
    }
    else {
        delete_hanger(hanger_id).then(res.status(204).end())
    }

})

// user controller function:

user.get('/', function (req, res) {
    const pilots = get_pilots_unprotected()
        .then((pilots) => {
            res.status(200).json(pilots);
        });
});


// backup login fucntion:

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
app.use('/users', user);
app.use('/pilots', router);
app.use('/planes', plane)
app.use('/login', login);
app.use('/hangers', hanger);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});