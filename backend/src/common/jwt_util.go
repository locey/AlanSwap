package common

import (
	"fmt"
	"github.com/golang-jwt/jwt/v4"
	"github.com/mumu/cryptoSwap/src/core/config"
	"time"
)

// 自定义JWT声明
type CustomClaims struct {
	Address string `json:"address"`
	jwt.RegisteredClaims
}

// 生成JWT令牌
func GenerateJWT(address string) (string, string, int64, error) {
	// 创建访问令牌
	expirationTime := time.Now().Add(time.Duration(config.Conf.App.JwtTTL) * time.Hour)
	claims := &CustomClaims{
		Address: address,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Subject:   address,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessToken, err := token.SignedString([]byte(config.Conf.App.JwtSecret))
	if err != nil {
		return "", "", 0, err
	}

	// 创建刷新令牌
	refreshExpirationTime := time.Now().Add(time.Duration(config.Conf.App.JwtTTL) * time.Hour)
	refreshClaims := &CustomClaims{
		Address: address,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(refreshExpirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Subject:   address,
		},
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString([]byte(config.Conf.App.JwtSecret))
	if err != nil {
		return "", "", 0, err
	}

	return accessToken, refreshTokenString, expirationTime.Unix(), nil
}

// 验证JWT令牌
func ValidateJWT(tokenString string) (*CustomClaims, error) {
	claims := &CustomClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.Conf.App.JwtSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}
