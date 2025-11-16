package main

import (
	"log"
	"os"
	"strconv"
)

func main() {
	portStr := os.Getenv("PORT")
	if portStr == "" {
		log.Fatal("PORT environment variable not set")
	}

	port, err := strconv.Atoi(portStr)
	if err != nil {
		log.Fatalf("Invalid port number: %v", err)
	}

	log.Printf("BaaS instance starting on port %d...", port)
	Run("LighterBase-Instance", port, routes)
}
