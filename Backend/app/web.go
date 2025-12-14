package main

import (
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/etag"
)

func web() {
	app := fiber.New(fiber.Config{AppName: "Website"})

	app.Use(compress.New())
	app.Use(etag.New())

	app.Static("/", "./dist", fiber.Static{
		Compress:      true,
		CacheDuration: 0,
		MaxAge:        0,
		Index:         "index.html",
	})

	go func() {
		time.Sleep(300 * time.Millisecond)
		openBrowser("http:localhost:8090")
	}()

	log.Fatal(app.Listen(":8090"))
}
