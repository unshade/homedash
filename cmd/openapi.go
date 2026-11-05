/*
Copyright © 2026 Noé Steiner
*/
package cmd

import (
	"encoding/json"

	"github.com/spf13/cobra"

	"github.com/unshade/homedash/internal/api"
)

// openapiCmd represents the openapi command
var openapiCmd = &cobra.Command{
	Use:   "openapi",
	Short: "Print the OpenAPI 3.1 document of the API",
	Long: `Print the OpenAPI 3.1 document of the API as JSON, without starting the server
or connecting to the database. The frontend generates its API types from it
(task web:api).`,
	Args: cobra.NoArgs,
	RunE: func(cmd *cobra.Command, _ []string) error {
		enc := json.NewEncoder(cmd.OutOrStdout())
		enc.SetIndent("", "  ")
		return enc.Encode(api.OpenAPI(Version))
	},
}

func init() {
	rootCmd.AddCommand(openapiCmd)
}
