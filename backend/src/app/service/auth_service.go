package service

import "github.com/mumu/cryptoSwap/src/app/model"

type AuthService struct {
	dao *model.AuthReq
}

func NewAuthService() *AuthService {
	return &AuthService{dao: &model.AuthReq{}}
}
