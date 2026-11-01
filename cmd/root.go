// Package cmd holds the homedash cobra commands. Add new ones with `task cobra:add -- <name>`.
package cmd

import (
	"os"

	"github.com/spf13/cobra"
)

// Version is overridden at build time with -ldflags "-X github.com/unshade/homedash/cmd.Version=...".
var Version = "dev"

var rootCmd = &cobra.Command{
	Use:          "homedash",
	Short:        "Self-hostable dashboard for everything at home",
	SilenceUsage: true,
}

// Execute runs the root command and exits non-zero on error.
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
