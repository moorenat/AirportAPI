Nathaniel Moore

# Airport API hosted on GCP


## Account creation/login URL:  [https://moorenat-oauth.wl.r.appspot.com/](https://moorenat-oauth.wl.r.appspot.com/)

## Application URL: [https://moorenat-hw7.uc.r.appspot.com](https://moorenat-hw7.uc.r.appspot.com/)

Visit the login URL first to obtain jwt tokens.

After logging in copy &quot;id\_token&quot; value to clipboard and save as jwt1 in the postman environment. Then log into or create another account and save that &quot;id\_token&quot; as jwt2 in the postman environment. Then you should be able to run the automated test suite without updating any other variables.

## Pagination: 

I intended to implement pagination with a combination of setting a query limit through datastore and having a next button in the returned results.

I began looking into datastore query limiting but I ran out of time. I spent nearly a day getting my AuthO app to work on GCP so pagination was the lowest on my priority list.

I suspect I could have gotten pagination working but I left it a little too long. I wanted to make sure to have a robust test suite for all of the endpoints.

## Data Model 

This app supports three entities: Pilots, Planes, and Hangers.

## Pilots:  This is the user entity.

|  Property  |  Data Type  |  Notes  |
| --- | --- | --- |
| name | String | Name of the pilot |
| sub | String | AuthO identifier. Used by planes as the pilot identifier |
| id | Integer | Datastore unique identifier. Used for /delete operation on pilots. |

## Planes:  
This is a protected entity tied to pilots.

|  Property  |  Data Type  |  Notes  |
| --- | --- | --- |
| id | integer | Datastore identifier used for get, patch and delete to /planes/:plane\_ID |
| pilot | string | Pilot identifier from the user. Only the pilot can modify a plane. |
| hanger\_id | Integer | Datastore id for the hanger the plane is stored in. Only one plane may be in a hanger |
| manufacturer | string | Manufacturer of the plane |
| tailNo | string | Tail number of the plane |
| color | String | Color of the plane |
| self | string | url of the plane entity |

## Hangers:  
This is an unprotected entity, however plane\_id cannot be changed unless by a secured post, patch or delete from /planes.

|  Property  |  Data type  |  Notes  |
| --- | --- | --- |
| id | integer | Datastore identifier. Used as hanger\_id in plane entity. |
| name | string | Name of the hanger |
| plane\_id | integer | datastore identifier of plane entity |
| runway | string | runway of the hanger |
| type | string | type of hanger |
| self | string | url of hanger entity |

## Create a Pilot: 

Allows you to create a new pilot. This is a secured endpoint that requires a valid jwt token.

| POST /pilots |
| --- |

## Request Body Format: 

JSON

## Request headers: 

Authorization: Bearer Token (jwt token)

Content-Type: &quot;application/json&quot;

Accept: &quot;application/json&quot;

## Request JSON Attributes: 

|  Property  |  Data Type  |  Required?  |
| --- | --- | --- |
| name | String | Yes |

## Request body example: 

 { &quot;name&quot;: &quot;Test Pilot 1&quot;} 


## Response body format: 

JSON

## Response Statuses: 

|  Outcome  |  Status Code  |  Notes/Output  |
| --- | --- | --- |
| Success | 201 Created | Response body returns datastore ID used for /delete requests on pilots|
| Unauthorized | 401 Unauthorized | Returned if jwt token is missing or bad. |

## Read Pilots: 

Secure endpoint that returns all pilots associated with a valid jwt token.

| GET /pilots |
| --- |

## Request body: 
N/A

## Request Headers: 

Authorization: Bearer Token (jwt token)

Accept: &quot;application/json&quot;

|  Outcome  |  Status Code  |  Notes/Output  |
| --- | --- | --- |
| Success | 200 OK | Response body returns array of pilot entities. 
| Unauthorized | 401 Unauthorized | Returned if jwt token is missing or bad. |

## Response Example:
```
[
    {
        "name": "Test Pilot 1",
        "sub": "auth0|61a9420ee36b36006b7dd779",
        "id": "5735151820603392"
    }
]

```

## Delete Pilot: 

Secure endpoint for deleting a pilot entity. Requires valid jwt token and pilot\_id

| DELETE /pilots/:pilot\_id |
| --- |

## Request body: 
N/A 

## Request Headers: 

Authorization: Bearer Token (jwt token)

|  Outcome  |  Status Code  |  Notes/Output  |
| --- | --- | --- |
| Success | 204 No content | |
| Unauthorized | 401 Unauthorized | Returned if jwt token is missing or bad. |
| Forbidden | 403 Forbidden | Returned if jwt token is valid but does not correspond to the pilot entity. |
| Not Found | 404 Not Found | Returned if pilot entity does not exist |

## Unsupported on Pilots: 

 /pilots does not support PUT, PATCH, or DELETE (to delete use /pilots/:pilot\_id)


## Read all pilots: 

Unsecure endpoint that returns all users/pilots

| GET /users |
| --- |

## Request body:
N/A 

## Request Headers: 

Accept: &quot;application/json&quot;

## Response Type: 

## JSON 

## Response Statuses: 

|  Outcome  |  Status Code  |  Notes/Output  |
| --- | --- | --- |
| Success | 200 OK | Response body returns array of pilot entities.|

## Response body example:
```
[
    {
        "name": "Test Pilot 1",
        "sub": "auth0|61a9420ee36b36006b7dd779",
        "id": "5735151820603392"
    }
]
```

## Create a Hanger: 

Unprotected endpoint for hanger creation. Initiates the value of plane\_id to null.

| POST /hangers |
| --- |

## Request Body: 

Required

## Request Body Format: 

JSON

## Request Headers: 

Accept: &quot;application/json&quot;

Content-Type: &quot;application/json&quot;

## Request JSON Attributes: 

|  Property  |  Description  |  Required?  |
| --- | --- | --- |
| name | Name of the hanger. String | Yes |
| runway | Name of the runway. String | Yes |
| type | Type of hanger. e.g. &quot;Enclosed&quot;, &quot;Open&quot; etc | Yes |

## Request Body Example: 
```
{
    "name": "Hanger1",
    "runway": "North",
    "type": "Enclosed"
}
```
## Response body format: 

## JSON 

## Response Statuses 

|  Outcome  |  Status Code  |  Notes/Output  |
| --- | --- | --- |
| Success | 201 Created ||
| Failure | 415 Unsupported Media Type | Returned if request body is not application/JSON |

## Response Examples: 

## Success: 

```
{
    "id": "5657818854064128",
    "name": "Hanger1",
    "plane_id": null,
    "runway": "North",
    "type": "Enclosed",
    "self": "http://moorenat-hw7.uc.r.appspot.com/hangers/5657818854064128"
}
```

## Failure: 

```
{
    "Error": "Server only accepts application/json data"
}
```

## Get all Hangers: 

Unprotected endpoint that returns all hangers.

|  GET /hangers |
| --- |

## Request Body: N/A 

## Request Headers: 

Accept: &quot;application/json&quot;

## Response Type: 

## JSON 

## Response Statuses: 

|  Outcome  |  Status Code  |  Notes/Output  |
| --- | --- | --- |
| Success | 200 OK | Response body returns array of pilot entities. |

## Response Example:
```
[
    {
        "name": "Hanger1",
        "plane_id": "5670706842959872",
        "type": "Enclosed",
        "runway": "North",
        "self": "http://moorenat-hw7.uc.r.appspot.com/hangers/5643550469390336",
        "id": "5643550469390336"
    },
    {
        "self": "http://moorenat-hw7.uc.r.appspot.com/hangers/5657818854064128",
        "runway": "North",
        "name": "Hanger1",
        "type": "Enclosed",
        "plane_id": null,
        "id": "5657818854064128"
    }
]
```

## Get a hanger: 

Unprotected endpoint to retrieve a specific hanger.

| GET hangers/:hanger\_id |
| --- |

## Request body: N/A 

## Request Headers: 

Accept: &quot;application/json&quot;

## Response Statuses: 

|  Outcome  |  Status Code  |  Notes/output  |
| --- | --- | --- |
| Success | 200 OK | |
| Failure | 404 Not Found | If the hanger does not exist |
| Failure | 406 Not Acceptable | {&quot;Error&quot;: &quot;accept header must be application/json&quot;} |

## Response Example:
```
{
    "name": "Hanger1",
    "runway": "North",
    "self": "http://moorenat-hw7.uc.r.appspot.com/hangers/5657818854064128",
    "plane_id": "5669826643099648",
    "type": "Enclosed",
    "id": "5657818854064128"
}
```
## Update a hanger: 

Unprotected endpoint for changing attributes of a hanger.

| PATCH /hangers/:hanger\_id |
| --- |

## Request body: 

## JSON 

## Request headers: 

Content-Type: &quot;application/json&quot;

Accept: &quot;application/json&quot;

## Request JSON Attributes: 

At least one of the three attributes is required.

|  Property  |  Description  |  Required?  |
| --- | --- | --- |
| name | Name of the hanger. String | No |
| runway | Name of the runway. String | No |
| type | Type of hanger. e.g. &quot;Enclosed&quot;, &quot;Open&quot; etc | No |

## Request Body Example: 

```
{
    "name": "Hanger1",
    "runway": "North",
    "type": "Enclosed"
}
```

## Response body format: 

## JSON 

## Response Statuses 

|  Outcome  |  Status Code  |  Notes/Output  |
| --- | --- | --- |
| Success | 201 Created ||
| Failure | 415 Unsupported Media Type | Returned if request body is not application/JSON |
| Failure | 400 Bad Request | Returned if request body is missing an attribute or if the attribute does not match the data model. |

## Response Examples: 

## Success: 

| {&quot;id&quot;: &quot;5657818854064128&quot;,&quot;name&quot;: &quot;Hanger1&quot;,&quot;plane\_id&quot;: ## null  ,&quot;runway&quot;: &quot;North&quot;,&quot;type&quot;: &quot;Enclosed&quot;,&quot;self&quot;: &quot;http://moorenat-hw7.uc.r.appspot.com/hangers/5657818854064128&quot;}
 |
| --- |

## Failure: 

| {&quot;Error&quot;: &quot;Server only accepts application/json data&quot;}
 |
| --- |

## Delete a hanger: 

Unprotected endpoint for deleting a hanger. Plane\_id must be null to be able to delete hanger.

| DELETE /hangers/:hanger\_id
 |
| --- |

## Request body: N/A 

## Request headers: N/A 

## Response Status Codes: 

|  Outcome  |  Status Code  |  Notes  |
| --- | --- | --- |
| Success | 204 No content | successfully deleted |
| Failure | 404 Not Found | Hanger does not exist |
| Failure | 403 Forbidden | Cannot delete a hanger while a plane is inside. |

## Create a Plane: 

Protected endpoint for creating a plane. Requires valid jwt token.

| POST /planes |
| --- |

## Request Body Format: 

JSON

## Request Headers: 

Content-Type: &quot;application/json&quot;

Accept: &quot;application/json&quot;

## Request JSON Attributes: 

hanger\_id must be valid to post a plane. Make sure to create a hanger and use the hanger\_id in the request prior to creating a plane

|  Name  |  Description  |  Required?  |
| --- | --- | --- |
| hanger\_id
 | hanger id where plane is stored | yes |
| manufacturer | maker of the plane | yes |
| tailNo | tail number of the plane | yes |
| color | color of the plane | yes |

## Request body example: 

| {&quot;hanger\_id&quot;: 5085025104035840&quot;manufacturer&quot;: &quot;Boeing&quot;,&quot;tailNo&quot;: &quot;1999A&quot;,&quot;color&quot;: &quot;Red&quot;}
 |
| --- |

## Response Body Format: 

JSON

## Response statuses: 

|  Outcome  |  Status Code  |  Notes  |
| --- | --- | --- |
| Success | 201 Created |
 |
| Failure | 415 Unsupported Media Type | Returned if request body is not application/json |
| Failure | 403 Forbidden | Returned if hanger is already occupied |
| Failure | 404 Not Found | Returned if hanger does not exist. |
| Failure | 401 Unauthorized | Returned if jwt token is missing or invalid. |

## Response examples: 

## Success: 

| {&quot;id&quot;: &quot;5737003958140928&quot;,&quot;pilot&quot;: &quot;auth0|6192b8f9a70765006a0fb4ae&quot;,&quot;hanger\_id&quot;: 5085025104035840,&quot;manufacturer&quot;: &quot;Boeing&quot;,&quot;tailNo&quot;: &quot;1999A&quot;,&quot;color&quot;: &quot;Red&quot;,&quot;self&quot;: &quot;http://moorenat-hw7.uc.r.appspot.com/planes/5737003958140928&quot;}
 |
| --- |

## Failure: 

| ## 403 forbidden 
{&quot;Error&quot;: &quot;Hanger is already occupied&quot;}
 |
| --- |

## Read planes protected: 

Protected endpoint to get all planes tied to pilot&#39;s jwt.

| GET /planes |
| --- |

## Request body: N/A 

## Request headers: 

Accept: &quot;application/json&quot;

## Response Body Format: 

## JSON 

## Response Statuses: 

|  Outcome  |  Status Code  |  Notes  |
| --- | --- | --- |
| Success | 200 OK | Returns array of plane entities[{&quot;tailNo&quot;: &quot;1999A&quot;,&quot;self&quot;: &quot;http://moorenat-hw7.uc.r.appspot.com/planes/5082649047597056&quot;,&quot;manufacturer&quot;: &quot;Boeing&quot;,&quot;color&quot;: &quot;Red&quot;,&quot;pilot&quot;: &quot;auth0|6192b8f9a70765006a0fb4ae&quot;,&quot;hanger\_id&quot;: &quot;5169161030336512&quot;,&quot;id&quot;: &quot;5082649047597056&quot;},{&quot;tailNo&quot;: &quot;1999A&quot;,&quot;self&quot;: &quot;http://moorenat-hw7.uc.r.appspot.com/planes/5106987083759616&quot;,&quot;manufacturer&quot;: &quot;Boeing&quot;,&quot;pilot&quot;: &quot;auth0|6192b8f9a70765006a0fb4ae&quot;,&quot;hanger\_id&quot;: &quot;5702124797165568&quot;,&quot;color&quot;: &quot;Red&quot;,&quot;id&quot;: &quot;5106987083759616&quot;}] |
| Failure | 404 Not found | No planes exist for this pilot |

## Read planes unprotected: 

Unprotected endpoint which gets all plane entities in the database.

| GET /planes/unsecure |
| --- |

## Request body: N/A 

## Request headers: 

Accept: &quot;application/json&quot;

## Response Body Format: 

## JSON 

## Response Statuses: 

|  Outcome  |  Status Code  |  Notes  |
| --- | --- | --- |
| Success | 200 OK | Returns array of plane entities[{&quot;tailNo&quot;: &quot;1999A&quot;,&quot;self&quot;: &quot;http://moorenat-hw7.uc.r.appspot.com/planes/5082649047597056&quot;,&quot;manufacturer&quot;: &quot;Boeing&quot;,&quot;color&quot;: &quot;Red&quot;,&quot;pilot&quot;: &quot;auth0|6192b8f9a70765006a0fb4ae&quot;,&quot;hanger\_id&quot;: &quot;5169161030336512&quot;,&quot;id&quot;: &quot;5082649047597056&quot;},{&quot;tailNo&quot;: &quot;1999A&quot;,&quot;self&quot;: &quot;http://moorenat-hw7.uc.r.appspot.com/planes/5106987083759616&quot;,&quot;manufacturer&quot;: &quot;Boeing&quot;,&quot;pilot&quot;: &quot;auth0|6192b8f9a70765006a0fb4ae&quot;,&quot;hanger\_id&quot;: &quot;5702124797165568&quot;,&quot;color&quot;: &quot;Red&quot;,&quot;id&quot;: &quot;5106987083759616&quot;}] |
| Failure | 406 Not Acceptable | {&quot;Error&quot;: &quot;accept header must be application/json&quot;}
 |

## Read a plane: 

Protected endpoint to retrieve a specific plane. Requires valid jwt token.

| GET /planes/:plane\_id
 |
| --- |

## Request Body: N/A 

## Request Headers: 

Accept: &quot;application/json&quot;

## Response body format: 

## JSON 

## Response Statuses: 

|  Outcome  |  Status Code  |  Notes/Response  |
| --- | --- | --- |
| Success | 200 OK | {&quot;pilot&quot;: &quot;auth0|6192b8f9a70765006a0fb4ae&quot;,&quot;hanger\_id&quot;: 5678927947235328,&quot;self&quot;: &quot;http://moorenat-hw7.uc.r.appspot.com/planes/5655024910729216&quot;,&quot;tailNo&quot;: &quot;1999A&quot;,&quot;manufacturer&quot;: &quot;Boeing&quot;,&quot;color&quot;: &quot;Red&quot;,&quot;id&quot;: &quot;5655024910729216&quot;}
 |
| Failure | 404 Not Found | Plane does not exist |
| Failure | 403 Forbidden | Plane exists but does not belong to the jwt token. |
| Failure | 401 Unauthorized | Invalid jwt token |

## Update a plane: 

Protected endpoint for updated attributes of a plane.

## Request body format: 

## JSON 

## Request headers: 

Content-Type: &quot;application/json&quot;

Accept: &quot;application/json&quot;

## Request JSON Attributes: 

At least one of the 4 attributes must be present.

|  Name  |  Description  |  Required?  |
| --- | --- | --- |
| hanger\_id
 | hanger id where plane is stored | no |
| manufacturer | maker of the plane | no |
| tailNo | tail number of the plane | no |
| color | color of the plane | no |

## Request body example: 

| {&quot;color&quot;: &quot;black&quot;,&quot;manufacturer&quot;: &quot;cessna&quot;}
 |
| --- |

## Response body format: 

## JSON 

## Response Statuses: 

|  Outcome  |  Status Code  |  Notes  |
| --- | --- | --- |
| Success | 201 Created |
 |
| Failure | 415 Unsupported Media Type | Returned if request body is not application/json |
| Failure | 403 Forbidden | Returned if hanger is already occupied |
| Failure | 404 Not Found | Returned if hanger does not exist. |
| Failure | 401 Unauthorized | Returned if jwt token is missing or invalid. |
| Failure | 400 Bad Request | Returned if request has an invalid attribute or no attributes. |

## Response Examples: 

## Success: 

| {&quot;hanger\_id&quot;: 5678927947235328,&quot;tailNo&quot;: &quot;1999A&quot;,&quot;manufacturer&quot;: &quot;cessna&quot;,&quot;pilot&quot;: &quot;auth0|6192b8f9a70765006a0fb4ae&quot;,&quot;color&quot;: &quot;black&quot;,&quot;self&quot;: &quot;http://moorenat-hw7.uc.r.appspot.com/planes/5655024910729216&quot;,&quot;id&quot;: &quot;5655024910729216&quot;}
 |
| --- |

## Failure: 

|  400 Bad Request: 
{&quot;Error&quot;: &quot;The request object is missing at least one of the required attributes&quot;}
 |
| --- |

## Delete a plane: 

Protected endpoint for deleting a plane. Requires valid jwt token corresponding to pilot.

## Request body: N/A 

## Request headers: N/A 

## Response Body: N/A 

## Response Statuses: 

|  Outcome  |  Status Code  |  Notes  |
| --- | --- | --- |
| Success | 204 No Content |
 |
| Failure | 404 Not Found | Plane does not exist |
| Failure | 403 Forbidden | jwt is valid but does not correspond to pilot of plane |
| Failure | 401 Unauthorized | Invalid or missing jwt. |
