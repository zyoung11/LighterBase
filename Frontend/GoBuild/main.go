package main

import (
	"embed"
	"log"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/etag"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
)

//go:embed build/*
var buildFS embed.FS

func main() {
	app := fiber.New()

	app.Use(compress.New())
	app.Use(etag.New())

	app.Use("/", filesystem.New(filesystem.Config{
		Root:       http.FS(buildFS),
		PathPrefix: "build",
		Index:      "index.html",
		MaxAge:     86400,
	}))

	app.Use("*", func(c *fiber.Ctx) error {
		return filesystem.SendFile(c, http.FS(buildFS), "build/index.html")
	})

	log.Fatal(app.Listen(":80"))
}
