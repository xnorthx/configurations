# Configuration Manager - The App
Written for Node 5.x

## Basic Operations

We'll use basic curl commands to demonstrate usage of the API. 

Before any configurations can be created, read, updated, or deleted we must create a user. All configurations are on a per-user basis and are not visible to any other user (or the unauthenticated public).

All endpoints return JSON (or a 204 No Content). When an error occurs the appropriate HTTP Status is returned (400, 404, etc) along with an error structure:

```
{
  "message": "Configuration asdf not found."
}
```

The rest of this documentation will not define the error cases in detail.

### Users

#### Create  User
Users are created via POST to /users with the required JSON payload:

```curl -X POST -s http://localhost:8000/users -d '{"name" : "joe", "password":"pass1234"}'```

On success this reflects the user object back to you, with the password scrubbed: 

```
{
  "name": "joe",
  "password": "********"
}
```
#### Login a User
Username/passwords are not used for authentication for API calls.  For that we use a session-based authToken.  To create an authToken, which is tied to a user, use the login command:

```
curl -X POST -s http://localhost:8000/login -d '{"name" : "joe", "password":"pass1234"}'
```

On success, the authToken is returned:

```
{
  "authToken": "dff909bd90bb7032"
}
```

On failure, an HTTP 400 + error message is returned 
```
{
  "message": "Username/password combination not found."
}
```
The authToken value will be used for all subsquent commands.

#### Logout a User
Users with a valid authToken can logout:

```
curl -X GET -H "auth-token: <Insert Auth Token>" -s "http://localhost:8000/logout
```

This command always returns an HTTP 204 (No Content) regardless of whether the token was valid or not.

### Configurations

#### Getting configurations
A user's configurations can be retrieved through a simple GET:

```
curl -X GET -H "auth-token: 8ff82ad461794a" -s "http://localhost:8000/configurations/joe"
```

This returns a structure like the following, which is truncated here for readability:
```
{
  "configs": [
    {
      "name": "anger",
      "hostname": "victorious-anger.example.com",
      "username": "draco",
      "port": 100
    },
    {
      "name": "grade",
      "hostname": "whispering-grade.example.com",
      "username": "hermione",
      "port": 33
    },
    {
      "name": "scarecrow",
      "hostname": "zealous-scarecrow.example.com",
      "username": "neville",
      "port": 58
    },
    {
      "name": "bread",
      "hostname": "fat-bread.example.com",
      "username": "remus",
      "port": 92
    },
    {
      "name": "drug",
      "hostname": "nice-drug.example.com",
      "username": "harry",
      "port": 63
    }
  ],
  "offset": 0,
  "limit": 20,
  "of": 30
}
```

For the purposes of this demo, 30 random configurations are created for each user.

#### Getting a single configuration
In addition to retreiving all of a user's configurations, we can also retrieve a single config:

```
curl -X GET -H "auth-token: 8ff82ad461794a" -s "http://localhost:8000/configurations/joe/winter"
```

Which returns:

```
{
  "name": "winter",
  "hostname": "straight-winter.example.com",
  "username": "remus",
  "port": 48
}
```

#### Updating a configuration
Configurations can be updated by name:

```
curl -X PUT -H "auth-token: 8ff82ad461794a" -s -d '{"name": "winter", "hostname": "voiceless-winter.example.com", "port" : 123, "username": "jack"}'  "http://localhost:8000/configurations/joe"
```

#### Deleting an individual configuration
Configurations can be deleted on a per-configuration basis, identified by its name:

```
curl -X DELETE -H "auth-token: 8ff82ad461794a" -s  "http://localhost:8000/configurations/joe/winter"
```

#### Pagination and sorting

##### Pagination

Pagination is enabled by default, using an offset of 0 and a limit of 20. These can easily be changed with query parameters:

```
curl -v -X GET -H "auth-token: 8ff82ad461794a" -s "http://localhost:8000/configurations/joe?limit=5&offset=10"
```

Offsets must be >= 0 and limit must be at least 1

##### Simple sorting
Sorting is enabled for configuration fields.  A simple sort on hostname would look like:

```
curl -v -X GET -H "auth-token: 8ff82ad461794a" -s "http://localhost:8000/configurations/joe?sort=port"
```

By default sorts are done in descending order.  To make a sort ascending, simply prepend the sort field with a '^':

```
curl -v -X GET -H "auth-token: 8ff82ad461794a" -s "http://localhost:8000/configurations/joe?sort=^port"
```

##### Complex sorting
We can also sort by more than one field, which is helpful as ports and usernames are not unique in our schema. Sorting is done by appending multiple sort criteria as such:

```
sort=port,username
```

Each individual directive support sorting too:

```
sort=port,^usename
```

A complete example:

```
curl -v -X GET -H "auth-token: 8ff82ad461794a" -s "http://localhost:8000/configurations/joe?sort=^port,username"
```

This will sort ascending by port, and with a secondary sort descending by username.


