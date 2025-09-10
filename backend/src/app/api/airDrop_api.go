package api

import (
	"github.com/gin-gonic/gin"
	"github.com/mumu/cryptoSwap/src/app/service"
)

type AirDropApi struct {
	svc *service.AirDropService
}

func NewAirDropApi() *AirDropApi {
	return &AirDropApi{
		svc: service.NewAirDropService(),
	}
}

func (a AirDropApi) Overview(context *gin.Context) {

}
