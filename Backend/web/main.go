package main

var routes = []Route{
	{Method: "GET", Path: "/health", Handler: health},
	{Method: "POST", Path: "/api/users/register", Handler: register},
	{Method: "POST", Path: "/api/users/login", Handler: login},
	{Method: "GET", Path: "/api/users", Handler: listUsers},
	{Method: "GET", Path: "/api/users/:id", Handler: getUser},
	{Method: "PUT", Path: "/api/users/:id", Handler: updateUser},
	{Method: "DELETE", Path: "/api/users/:id", Handler: deleteUser},
}

func main() {
	initBackend("LighterBaseHub", "build", 8080, 8090)
}
