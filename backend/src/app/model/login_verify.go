package model

type LoginVerify struct {
	Nonce         string `json:"nonce" gorm:"column:nonce"`
	Signature     string `json:"signature" gorm:"column:signature"`
	WalletAddress string `json:"address" gorm:"column:address"`
}
