// Package pb_routes provides custom route handlers for the application.
package pb_routes

import (
	"net/http"
	"pocketbase/pb_hooks/services"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

// callMatchChallengersRequest represents the expected request body.
type callMatchChallengersRequest struct {
	MatchId string `json:"match"`
}

// RegisterCallMatchChallengersRoute registers the /api/config GET route.
func RegisterCallMatchChallengersRoute(app *pocketbase.PocketBase, hooksDir string) {
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.POST("/api/match/call", func(e *core.RequestEvent) error {

			// Parse request body
			var form callMatchChallengersRequest
			if err := e.BindBody(&form); err != nil {
				return e.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
			}

			err, count := services.CallMatchChallengers(app, e.Auth.Id, form.MatchId)
			if err != nil {
				return e.JSON(http.StatusInternalServerError, map[string]string{"error": "cannot call challengers"})
			}

			return e.JSON(http.StatusOK, count)

		}).Bind(apis.RequireAuth())

		return se.Next()
	})
}
