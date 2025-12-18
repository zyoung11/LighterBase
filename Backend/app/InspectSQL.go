package main

import (
	"fmt"
	"io"
	"os"
	"regexp"
	"strings"

	"github.com/rqlite/sql"
)

func InspectSQL(raw string) (forbidden error, hasSchemaMod bool) {
	reLine := regexp.MustCompile(`(?m)--.*$`)
	reBlk := regexp.MustCompile(`/\*.*?\*/`)
	clean := reBlk.ReplaceAllString(reLine.ReplaceAllString(raw, " "), " ")

	protected := map[string]bool{
		"id": true, "name": true, "password_hash": true,
		"email": true, "avatar": true, "create_at": true, "update_at": true,
	}

	parser := sql.NewParser(strings.NewReader(clean))
	for {
		stmt, err := parser.ParseStatement()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, false
		}

		switch s := stmt.(type) {
		case *sql.AlterTableStatement:
			t := strings.ToLower(s.Name.Name)
			if t == "users" {
				if s.NewName != nil {
					return fmt.Errorf("forbidden operation: cannot rename the 'users' table"), false
				}
				if s.ColumnName != nil && protected[strings.ToLower(s.ColumnName.Name)] {
					return fmt.Errorf("forbidden operation: cannot rename protected column '%s' in 'users' table", s.ColumnName.Name), false
				}
				if s.DropColumnName != nil && protected[strings.ToLower(s.DropColumnName.Name)] {
					return fmt.Errorf("forbidden operation: cannot drop protected column '%s' from 'users' table", s.DropColumnName.Name), false
				}
			}
			hasSchemaMod = true

		case *sql.DropTableStatement:
			if strings.ToLower(s.Name.Name) == "users" {
				return fmt.Errorf("forbidden operation: cannot drop the 'users' table"), false
			}
			hasSchemaMod = true

		case *sql.BeginStatement, *sql.CommitStatement, *sql.RollbackStatement, *sql.SavepointStatement, *sql.ReleaseStatement:
			return fmt.Errorf("forbidden operation: transaction control statements (BEGIN, COMMIT, etc.) are not allowed"), false

		case *sql.PragmaStatement:
			if _, ok := s.Expr.(*sql.BinaryExpr); ok {
				return fmt.Errorf("forbidden operation: setting PRAGMA values is not allowed"), false
			}

		case *sql.CreateIndexStatement, *sql.CreateTableStatement, *sql.CreateTriggerStatement,
			*sql.CreateViewStatement, *sql.CreateVirtualTableStatement,
			*sql.DropIndexStatement, *sql.DropTriggerStatement, *sql.DropViewStatement, *sql.ReindexStatement:
			hasSchemaMod = true
		}
	}
	return nil, hasSchemaMod
}
