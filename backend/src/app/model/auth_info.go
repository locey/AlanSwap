package model

type AuthInfo struct {
}

// AuthReq
// @Description: 签名验证请求参数
type AuthReq struct {
	Nonce         string `json:"nonce" `
	WalletAddress string `json:"address" `
	Signature     string `json:"signature"`
}
