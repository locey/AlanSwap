// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package contract

import (
	"errors"
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = errors.New
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
	_ = abi.ConvertType
)

// StakeV2Pool is an auto generated low-level Go binding around an user-defined struct.
type StakeV2Pool struct {
	Id                    *big.Int
	PoolName              string
	TokenAddress          common.Address
	LockDuration          *big.Int
	AmountTotal           *big.Int
	IsActive              bool
	OracleDataFeedAddress common.Address
	FeeRatio              *big.Int
}

// StakeV2StakeRecord is an auto generated low-level Go binding around an user-defined struct.
type StakeV2StakeRecord struct {
	Amount            *big.Int
	StakedAt          *big.Int
	UnlockTime        *big.Int
	InitialSharePrice *big.Int
}

// AbiMetaData contains all meta data concerning the Abi contract.
var AbiMetaData = &bind.MetaData{
	ABI: "[{\"inputs\":[],\"name\":\"AccessControlBadConfirmation\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"},{\"internalType\":\"bytes32\",\"name\":\"neededRole\",\"type\":\"bytes32\"}],\"name\":\"AccessControlUnauthorizedAccount\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"target\",\"type\":\"address\"}],\"name\":\"AddressEmptyCode\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"implementation\",\"type\":\"address\"}],\"name\":\"ERC1967InvalidImplementation\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"ERC1967NonPayable\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"EnforcedPause\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"ExpectedPause\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"FailedCall\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"InvalidInitialization\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"NotInitializing\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"ReentrancyGuardReentrantCall\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"token\",\"type\":\"address\"}],\"name\":\"SafeERC20FailedOperation\",\"type\":\"error\"},{\"inputs\":[],\"name\":\"UUPSUnauthorizedCallContext\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"slot\",\"type\":\"bytes32\"}],\"name\":\"UUPSUnsupportedProxiableUUID\",\"type\":\"error\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"user\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"poolId\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"reward\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"claimedAt\",\"type\":\"uint256\"}],\"name\":\"ClaimRewards\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint64\",\"name\":\"version\",\"type\":\"uint64\"}],\"name\":\"Initialized\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"}],\"name\":\"Paused\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"poolId\",\"type\":\"uint256\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"token\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"lockDuration\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"string\",\"name\":\"name\",\"type\":\"string\"}],\"name\":\"PoolCreated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"role\",\"type\":\"bytes32\"},{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"previousAdminRole\",\"type\":\"bytes32\"},{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"newAdminRole\",\"type\":\"bytes32\"}],\"name\":\"RoleAdminChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"role\",\"type\":\"bytes32\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"}],\"name\":\"RoleGranted\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"bytes32\",\"name\":\"role\",\"type\":\"bytes32\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"}],\"name\":\"RoleRevoked\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"date\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"price\",\"type\":\"uint256\"}],\"name\":\"SharePriceUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"user\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"poolId\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"stakedAt\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"unlockTime\",\"type\":\"uint256\"}],\"name\":\"Staked\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"}],\"name\":\"Unpaused\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"implementation\",\"type\":\"address\"}],\"name\":\"Upgraded\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"user\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"poolId\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"reward\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"withdrawnAt\",\"type\":\"uint256\"}],\"name\":\"Withdrawn\",\"type\":\"event\"},{\"inputs\":[],\"name\":\"ADMIN_ROLE\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"DEFAULT_ADMIN_ROLE\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"FEE_ADDRESS\",\"outputs\":[{\"internalType\":\"addresspayable\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"UPGRADER_ROLE\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"UPGRADE_INTERFACE_VERSION\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"string\",\"name\":\"_poolName\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"_tokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_lockDuration\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"oracleDataFeedAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"sharePrice\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"feeRatio\",\"type\":\"uint256\"}],\"name\":\"addPool\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_poolId\",\"type\":\"uint256\"}],\"name\":\"claimRewards\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"poolId\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"dailySharePrices\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_poolId\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"deposit\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_poolId\",\"type\":\"uint256\"}],\"name\":\"depositEth\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getPools\",\"outputs\":[{\"components\":[{\"internalType\":\"uint256\",\"name\":\"id\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"poolName\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"tokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"lockDuration\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"amountTotal\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"isActive\",\"type\":\"bool\"},{\"internalType\":\"address\",\"name\":\"oracleDataFeedAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"feeRatio\",\"type\":\"uint256\"}],\"internalType\":\"structStakeV2.Pool[]\",\"name\":\"\",\"type\":\"tuple[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"role\",\"type\":\"bytes32\"}],\"name\":\"getRoleAdmin\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_poolId\",\"type\":\"uint256\"}],\"name\":\"getUserInfo\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"_amountTotal\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"_unclaimedRewards\",\"type\":\"uint256\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"stakedAt\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"unlockTime\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"initialSharePrice\",\"type\":\"uint256\"}],\"internalType\":\"structStakeV2.StakeRecord[]\",\"name\":\"_stakes\",\"type\":\"tuple[]\"},{\"internalType\":\"uint256\",\"name\":\"_total\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getV2\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"pure\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"role\",\"type\":\"bytes32\"},{\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"}],\"name\":\"grantRole\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"role\",\"type\":\"bytes32\"},{\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"}],\"name\":\"hasRole\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"initialize\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"pause\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"paused\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"pools\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"id\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"poolName\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"tokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"lockDuration\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"amountTotal\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"isActive\",\"type\":\"bool\"},{\"internalType\":\"address\",\"name\":\"oracleDataFeedAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"feeRatio\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"proxiableUUID\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"role\",\"type\":\"bytes32\"},{\"internalType\":\"address\",\"name\":\"callerConfirmation\",\"type\":\"address\"}],\"name\":\"renounceRole\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"role\",\"type\":\"bytes32\"},{\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"}],\"name\":\"revokeRole\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_poolId\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"_date\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"_price\",\"type\":\"uint256\"}],\"name\":\"setDailySharePrice\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_poolId\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"_isActive\",\"type\":\"bool\"}],\"name\":\"setPoolActive\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes4\",\"name\":\"interfaceId\",\"type\":\"bytes4\"}],\"name\":\"supportsInterface\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"unpause\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newImplementation\",\"type\":\"address\"},{\"internalType\":\"bytes\",\"name\":\"data\",\"type\":\"bytes\"}],\"name\":\"upgradeToAndCall\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"users\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"amountTotal\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"unclaimedRewards\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_poolId\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"_amount\",\"type\":\"uint256\"}],\"name\":\"withdraw\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]",
}

// AbiABI is the input ABI used to generate the binding from.
// Deprecated: Use AbiMetaData.ABI instead.
var AbiABI = AbiMetaData.ABI

// Abi is an auto generated Go binding around an Ethereum contract.
type Abi struct {
	AbiCaller     // Read-only binding to the contract
	AbiTransactor // Write-only binding to the contract
	AbiFilterer   // Log filterer for contract events
}

// AbiCaller is an auto generated read-only Go binding around an Ethereum contract.
type AbiCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// AbiTransactor is an auto generated write-only Go binding around an Ethereum contract.
type AbiTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// AbiFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type AbiFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// AbiSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type AbiSession struct {
	Contract     *Abi              // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// AbiCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type AbiCallerSession struct {
	Contract *AbiCaller    // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts // Call options to use throughout this session
}

// AbiTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type AbiTransactorSession struct {
	Contract     *AbiTransactor    // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// AbiRaw is an auto generated low-level Go binding around an Ethereum contract.
type AbiRaw struct {
	Contract *Abi // Generic contract binding to access the raw methods on
}

// AbiCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type AbiCallerRaw struct {
	Contract *AbiCaller // Generic read-only contract binding to access the raw methods on
}

// AbiTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type AbiTransactorRaw struct {
	Contract *AbiTransactor // Generic write-only contract binding to access the raw methods on
}

// NewAbi creates a new instance of Abi, bound to a specific deployed contract.
func NewAbi(address common.Address, backend bind.ContractBackend) (*Abi, error) {
	contract, err := bindAbi(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &Abi{AbiCaller: AbiCaller{contract: contract}, AbiTransactor: AbiTransactor{contract: contract}, AbiFilterer: AbiFilterer{contract: contract}}, nil
}

// NewAbiCaller creates a new read-only instance of Abi, bound to a specific deployed contract.
func NewAbiCaller(address common.Address, caller bind.ContractCaller) (*AbiCaller, error) {
	contract, err := bindAbi(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &AbiCaller{contract: contract}, nil
}

// NewAbiTransactor creates a new write-only instance of Abi, bound to a specific deployed contract.
func NewAbiTransactor(address common.Address, transactor bind.ContractTransactor) (*AbiTransactor, error) {
	contract, err := bindAbi(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &AbiTransactor{contract: contract}, nil
}

// NewAbiFilterer creates a new log filterer instance of Abi, bound to a specific deployed contract.
func NewAbiFilterer(address common.Address, filterer bind.ContractFilterer) (*AbiFilterer, error) {
	contract, err := bindAbi(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &AbiFilterer{contract: contract}, nil
}

// bindAbi binds a generic wrapper to an already deployed contract.
func bindAbi(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := AbiMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Abi *AbiRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Abi.Contract.AbiCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Abi *AbiRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Abi.Contract.AbiTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Abi *AbiRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Abi.Contract.AbiTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Abi *AbiCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Abi.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Abi *AbiTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Abi.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Abi *AbiTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Abi.Contract.contract.Transact(opts, method, params...)
}

// ADMINROLE is a free data retrieval call binding the contract method 0x75b238fc.
//
// Solidity: function ADMIN_ROLE() view returns(bytes32)
func (_Abi *AbiCaller) ADMINROLE(opts *bind.CallOpts) ([32]byte, error) {
	var out []interface{}
	err := _Abi.contract.Call(opts, &out, "ADMIN_ROLE")

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// ADMINROLE is a free data retrieval call binding the contract method 0x75b238fc.
//
// Solidity: function ADMIN_ROLE() view returns(bytes32)
func (_Abi *AbiSession) ADMINROLE() ([32]byte, error) {
	return _Abi.Contract.ADMINROLE(&_Abi.CallOpts)
}

// ADMINROLE is a free data retrieval call binding the contract method 0x75b238fc.
//
// Solidity: function ADMIN_ROLE() view returns(bytes32)
func (_Abi *AbiCallerSession) ADMINROLE() ([32]byte, error) {
	return _Abi.Contract.ADMINROLE(&_Abi.CallOpts)
}

// DEFAULTADMINROLE is a free data retrieval call binding the contract method 0xa217fddf.
//
// Solidity: function DEFAULT_ADMIN_ROLE() view returns(bytes32)
func (_Abi *AbiCaller) DEFAULTADMINROLE(opts *bind.CallOpts) ([32]byte, error) {
	var out []interface{}
	err := _Abi.contract.Call(opts, &out, "DEFAULT_ADMIN_ROLE")

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// DEFAULTADMINROLE is a free data retrieval call binding the contract method 0xa217fddf.
//
// Solidity: function DEFAULT_ADMIN_ROLE() view returns(bytes32)
func (_Abi *AbiSession) DEFAULTADMINROLE() ([32]byte, error) {
	return _Abi.Contract.DEFAULTADMINROLE(&_Abi.CallOpts)
}

// DEFAULTADMINROLE is a free data retrieval call binding the contract method 0xa217fddf.
//
// Solidity: function DEFAULT_ADMIN_ROLE() view returns(bytes32)
func (_Abi *AbiCallerSession) DEFAULTADMINROLE() ([32]byte, error) {
	return _Abi.Contract.DEFAULTADMINROLE(&_Abi.CallOpts)
}

// FEEADDRESS is a free data retrieval call binding the contract method 0xeb1edd61.
//
// Solidity: function FEE_ADDRESS() view returns(address)
func (_Abi *AbiCaller) FEEADDRESS(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Abi.contract.Call(opts, &out, "FEE_ADDRESS")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// FEEADDRESS is a free data retrieval call binding the contract method 0xeb1edd61.
//
// Solidity: function FEE_ADDRESS() view returns(address)
func (_Abi *AbiSession) FEEADDRESS() (common.Address, error) {
	return _Abi.Contract.FEEADDRESS(&_Abi.CallOpts)
}

// FEEADDRESS is a free data retrieval call binding the contract method 0xeb1edd61.
//
// Solidity: function FEE_ADDRESS() view returns(address)
func (_Abi *AbiCallerSession) FEEADDRESS() (common.Address, error) {
	return _Abi.Contract.FEEADDRESS(&_Abi.CallOpts)
}

// UPGRADERROLE is a free data retrieval call binding the contract method 0xf72c0d8b.
//
// Solidity: function UPGRADER_ROLE() view returns(bytes32)
func (_Abi *AbiCaller) UPGRADERROLE(opts *bind.CallOpts) ([32]byte, error) {
	var out []interface{}
	err := _Abi.contract.Call(opts, &out, "UPGRADER_ROLE")

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// UPGRADERROLE is a free data retrieval call binding the contract method 0xf72c0d8b.
//
// Solidity: function UPGRADER_ROLE() view returns(bytes32)
func (_Abi *AbiSession) UPGRADERROLE() ([32]byte, error) {
	return _Abi.Contract.UPGRADERROLE(&_Abi.CallOpts)
}

// UPGRADERROLE is a free data retrieval call binding the contract method 0xf72c0d8b.
//
// Solidity: function UPGRADER_ROLE() view returns(bytes32)
func (_Abi *AbiCallerSession) UPGRADERROLE() ([32]byte, error) {
	return _Abi.Contract.UPGRADERROLE(&_Abi.CallOpts)
}

// UPGRADEINTERFACEVERSION is a free data retrieval call binding the contract method 0xad3cb1cc.
//
// Solidity: function UPGRADE_INTERFACE_VERSION() view returns(string)
func (_Abi *AbiCaller) UPGRADEINTERFACEVERSION(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _Abi.contract.Call(opts, &out, "UPGRADE_INTERFACE_VERSION")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

// UPGRADEINTERFACEVERSION is a free data retrieval call binding the contract method 0xad3cb1cc.
//
// Solidity: function UPGRADE_INTERFACE_VERSION() view returns(string)
func (_Abi *AbiSession) UPGRADEINTERFACEVERSION() (string, error) {
	return _Abi.Contract.UPGRADEINTERFACEVERSION(&_Abi.CallOpts)
}

// UPGRADEINTERFACEVERSION is a free data retrieval call binding the contract method 0xad3cb1cc.
//
// Solidity: function UPGRADE_INTERFACE_VERSION() view returns(string)
func (_Abi *AbiCallerSession) UPGRADEINTERFACEVERSION() (string, error) {
	return _Abi.Contract.UPGRADEINTERFACEVERSION(&_Abi.CallOpts)
}

// DailySharePrices is a free data retrieval call binding the contract method 0x4275785e.
//
// Solidity: function dailySharePrices(uint256 poolId, uint256 ) view returns(uint256)
func (_Abi *AbiCaller) DailySharePrices(opts *bind.CallOpts, poolId *big.Int, arg1 *big.Int) (*big.Int, error) {
	var out []interface{}
	err := _Abi.contract.Call(opts, &out, "dailySharePrices", poolId, arg1)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// DailySharePrices is a free data retrieval call binding the contract method 0x4275785e.
//
// Solidity: function dailySharePrices(uint256 poolId, uint256 ) view returns(uint256)
func (_Abi *AbiSession) DailySharePrices(poolId *big.Int, arg1 *big.Int) (*big.Int, error) {
	return _Abi.Contract.DailySharePrices(&_Abi.CallOpts, poolId, arg1)
}

// DailySharePrices is a free data retrieval call binding the contract method 0x4275785e.
//
// Solidity: function dailySharePrices(uint256 poolId, uint256 ) view returns(uint256)
func (_Abi *AbiCallerSession) DailySharePrices(poolId *big.Int, arg1 *big.Int) (*big.Int, error) {
	return _Abi.Contract.DailySharePrices(&_Abi.CallOpts, poolId, arg1)
}

// GetPools is a free data retrieval call binding the contract method 0x673a2a1f.
//
// Solidity: function getPools() view returns((uint256,string,address,uint256,uint256,bool,address,uint256)[])
func (_Abi *AbiCaller) GetPools(opts *bind.CallOpts) ([]StakeV2Pool, error) {
	var out []interface{}
	err := _Abi.contract.Call(opts, &out, "getPools")

	if err != nil {
		return *new([]StakeV2Pool), err
	}

	out0 := *abi.ConvertType(out[0], new([]StakeV2Pool)).(*[]StakeV2Pool)

	return out0, err

}

// GetPools is a free data retrieval call binding the contract method 0x673a2a1f.
//
// Solidity: function getPools() view returns((uint256,string,address,uint256,uint256,bool,address,uint256)[])
func (_Abi *AbiSession) GetPools() ([]StakeV2Pool, error) {
	return _Abi.Contract.GetPools(&_Abi.CallOpts)
}

// GetPools is a free data retrieval call binding the contract method 0x673a2a1f.
//
// Solidity: function getPools() view returns((uint256,string,address,uint256,uint256,bool,address,uint256)[])
func (_Abi *AbiCallerSession) GetPools() ([]StakeV2Pool, error) {
	return _Abi.Contract.GetPools(&_Abi.CallOpts)
}

// GetRoleAdmin is a free data retrieval call binding the contract method 0x248a9ca3.
//
// Solidity: function getRoleAdmin(bytes32 role) view returns(bytes32)
func (_Abi *AbiCaller) GetRoleAdmin(opts *bind.CallOpts, role [32]byte) ([32]byte, error) {
	var out []interface{}
	err := _Abi.contract.Call(opts, &out, "getRoleAdmin", role)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// GetRoleAdmin is a free data retrieval call binding the contract method 0x248a9ca3.
//
// Solidity: function getRoleAdmin(bytes32 role) view returns(bytes32)
func (_Abi *AbiSession) GetRoleAdmin(role [32]byte) ([32]byte, error) {
	return _Abi.Contract.GetRoleAdmin(&_Abi.CallOpts, role)
}

// GetRoleAdmin is a free data retrieval call binding the contract method 0x248a9ca3.
//
// Solidity: function getRoleAdmin(bytes32 role) view returns(bytes32)
func (_Abi *AbiCallerSession) GetRoleAdmin(role [32]byte) ([32]byte, error) {
	return _Abi.Contract.GetRoleAdmin(&_Abi.CallOpts, role)
}

// GetUserInfo is a free data retrieval call binding the contract method 0xd379dadf.
//
// Solidity: function getUserInfo(uint256 _poolId) view returns(uint256 _amountTotal, uint256 _unclaimedRewards, (uint256,uint256,uint256,uint256)[] _stakes, uint256 _total)
func (_Abi *AbiCaller) GetUserInfo(opts *bind.CallOpts, _poolId *big.Int) (struct {
	AmountTotal      *big.Int
	UnclaimedRewards *big.Int
	Stakes           []StakeV2StakeRecord
	Total            *big.Int
}, error) {
	var out []interface{}
	err := _Abi.contract.Call(opts, &out, "getUserInfo", _poolId)

	outstruct := new(struct {
		AmountTotal      *big.Int
		UnclaimedRewards *big.Int
		Stakes           []StakeV2StakeRecord
		Total            *big.Int
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.AmountTotal = *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)
	outstruct.UnclaimedRewards = *abi.ConvertType(out[1], new(*big.Int)).(**big.Int)
	outstruct.Stakes = *abi.ConvertType(out[2], new([]StakeV2StakeRecord)).(*[]StakeV2StakeRecord)
	outstruct.Total = *abi.ConvertType(out[3], new(*big.Int)).(**big.Int)

	return *outstruct, err

}

// GetUserInfo is a free data retrieval call binding the contract method 0xd379dadf.
//
// Solidity: function getUserInfo(uint256 _poolId) view returns(uint256 _amountTotal, uint256 _unclaimedRewards, (uint256,uint256,uint256,uint256)[] _stakes, uint256 _total)
func (_Abi *AbiSession) GetUserInfo(_poolId *big.Int) (struct {
	AmountTotal      *big.Int
	UnclaimedRewards *big.Int
	Stakes           []StakeV2StakeRecord
	Total            *big.Int
}, error) {
	return _Abi.Contract.GetUserInfo(&_Abi.CallOpts, _poolId)
}

// GetUserInfo is a free data retrieval call binding the contract method 0xd379dadf.
//
// Solidity: function getUserInfo(uint256 _poolId) view returns(uint256 _amountTotal, uint256 _unclaimedRewards, (uint256,uint256,uint256,uint256)[] _stakes, uint256 _total)
func (_Abi *AbiCallerSession) GetUserInfo(_poolId *big.Int) (struct {
	AmountTotal      *big.Int
	UnclaimedRewards *big.Int
	Stakes           []StakeV2StakeRecord
	Total            *big.Int
}, error) {
	return _Abi.Contract.GetUserInfo(&_Abi.CallOpts, _poolId)
}

// GetV2 is a free data retrieval call binding the contract method 0x3a2350f1.
//
// Solidity: function getV2() pure returns(uint256)
func (_Abi *AbiCaller) GetV2(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Abi.contract.Call(opts, &out, "getV2")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// GetV2 is a free data retrieval call binding the contract method 0x3a2350f1.
//
// Solidity: function getV2() pure returns(uint256)
func (_Abi *AbiSession) GetV2() (*big.Int, error) {
	return _Abi.Contract.GetV2(&_Abi.CallOpts)
}

// GetV2 is a free data retrieval call binding the contract method 0x3a2350f1.
//
// Solidity: function getV2() pure returns(uint256)
func (_Abi *AbiCallerSession) GetV2() (*big.Int, error) {
	return _Abi.Contract.GetV2(&_Abi.CallOpts)
}

// HasRole is a free data retrieval call binding the contract method 0x91d14854.
//
// Solidity: function hasRole(bytes32 role, address account) view returns(bool)
func (_Abi *AbiCaller) HasRole(opts *bind.CallOpts, role [32]byte, account common.Address) (bool, error) {
	var out []interface{}
	err := _Abi.contract.Call(opts, &out, "hasRole", role, account)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// HasRole is a free data retrieval call binding the contract method 0x91d14854.
//
// Solidity: function hasRole(bytes32 role, address account) view returns(bool)
func (_Abi *AbiSession) HasRole(role [32]byte, account common.Address) (bool, error) {
	return _Abi.Contract.HasRole(&_Abi.CallOpts, role, account)
}

// HasRole is a free data retrieval call binding the contract method 0x91d14854.
//
// Solidity: function hasRole(bytes32 role, address account) view returns(bool)
func (_Abi *AbiCallerSession) HasRole(role [32]byte, account common.Address) (bool, error) {
	return _Abi.Contract.HasRole(&_Abi.CallOpts, role, account)
}

// Paused is a free data retrieval call binding the contract method 0x5c975abb.
//
// Solidity: function paused() view returns(bool)
func (_Abi *AbiCaller) Paused(opts *bind.CallOpts) (bool, error) {
	var out []interface{}
	err := _Abi.contract.Call(opts, &out, "paused")

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// Paused is a free data retrieval call binding the contract method 0x5c975abb.
//
// Solidity: function paused() view returns(bool)
func (_Abi *AbiSession) Paused() (bool, error) {
	return _Abi.Contract.Paused(&_Abi.CallOpts)
}

// Paused is a free data retrieval call binding the contract method 0x5c975abb.
//
// Solidity: function paused() view returns(bool)
func (_Abi *AbiCallerSession) Paused() (bool, error) {
	return _Abi.Contract.Paused(&_Abi.CallOpts)
}

// Pools is a free data retrieval call binding the contract method 0xac4afa38.
//
// Solidity: function pools(uint256 ) view returns(uint256 id, string poolName, address tokenAddress, uint256 lockDuration, uint256 amountTotal, bool isActive, address oracleDataFeedAddress, uint256 feeRatio)
func (_Abi *AbiCaller) Pools(opts *bind.CallOpts, arg0 *big.Int) (struct {
	Id                    *big.Int
	PoolName              string
	TokenAddress          common.Address
	LockDuration          *big.Int
	AmountTotal           *big.Int
	IsActive              bool
	OracleDataFeedAddress common.Address
	FeeRatio              *big.Int
}, error) {
	var out []interface{}
	err := _Abi.contract.Call(opts, &out, "pools", arg0)

	outstruct := new(struct {
		Id                    *big.Int
		PoolName              string
		TokenAddress          common.Address
		LockDuration          *big.Int
		AmountTotal           *big.Int
		IsActive              bool
		OracleDataFeedAddress common.Address
		FeeRatio              *big.Int
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.Id = *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)
	outstruct.PoolName = *abi.ConvertType(out[1], new(string)).(*string)
	outstruct.TokenAddress = *abi.ConvertType(out[2], new(common.Address)).(*common.Address)
	outstruct.LockDuration = *abi.ConvertType(out[3], new(*big.Int)).(**big.Int)
	outstruct.AmountTotal = *abi.ConvertType(out[4], new(*big.Int)).(**big.Int)
	outstruct.IsActive = *abi.ConvertType(out[5], new(bool)).(*bool)
	outstruct.OracleDataFeedAddress = *abi.ConvertType(out[6], new(common.Address)).(*common.Address)
	outstruct.FeeRatio = *abi.ConvertType(out[7], new(*big.Int)).(**big.Int)

	return *outstruct, err

}

// Pools is a free data retrieval call binding the contract method 0xac4afa38.
//
// Solidity: function pools(uint256 ) view returns(uint256 id, string poolName, address tokenAddress, uint256 lockDuration, uint256 amountTotal, bool isActive, address oracleDataFeedAddress, uint256 feeRatio)
func (_Abi *AbiSession) Pools(arg0 *big.Int) (struct {
	Id                    *big.Int
	PoolName              string
	TokenAddress          common.Address
	LockDuration          *big.Int
	AmountTotal           *big.Int
	IsActive              bool
	OracleDataFeedAddress common.Address
	FeeRatio              *big.Int
}, error) {
	return _Abi.Contract.Pools(&_Abi.CallOpts, arg0)
}

// Pools is a free data retrieval call binding the contract method 0xac4afa38.
//
// Solidity: function pools(uint256 ) view returns(uint256 id, string poolName, address tokenAddress, uint256 lockDuration, uint256 amountTotal, bool isActive, address oracleDataFeedAddress, uint256 feeRatio)
func (_Abi *AbiCallerSession) Pools(arg0 *big.Int) (struct {
	Id                    *big.Int
	PoolName              string
	TokenAddress          common.Address
	LockDuration          *big.Int
	AmountTotal           *big.Int
	IsActive              bool
	OracleDataFeedAddress common.Address
	FeeRatio              *big.Int
}, error) {
	return _Abi.Contract.Pools(&_Abi.CallOpts, arg0)
}

// ProxiableUUID is a free data retrieval call binding the contract method 0x52d1902d.
//
// Solidity: function proxiableUUID() view returns(bytes32)
func (_Abi *AbiCaller) ProxiableUUID(opts *bind.CallOpts) ([32]byte, error) {
	var out []interface{}
	err := _Abi.contract.Call(opts, &out, "proxiableUUID")

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// ProxiableUUID is a free data retrieval call binding the contract method 0x52d1902d.
//
// Solidity: function proxiableUUID() view returns(bytes32)
func (_Abi *AbiSession) ProxiableUUID() ([32]byte, error) {
	return _Abi.Contract.ProxiableUUID(&_Abi.CallOpts)
}

// ProxiableUUID is a free data retrieval call binding the contract method 0x52d1902d.
//
// Solidity: function proxiableUUID() view returns(bytes32)
func (_Abi *AbiCallerSession) ProxiableUUID() ([32]byte, error) {
	return _Abi.Contract.ProxiableUUID(&_Abi.CallOpts)
}

// SupportsInterface is a free data retrieval call binding the contract method 0x01ffc9a7.
//
// Solidity: function supportsInterface(bytes4 interfaceId) view returns(bool)
func (_Abi *AbiCaller) SupportsInterface(opts *bind.CallOpts, interfaceId [4]byte) (bool, error) {
	var out []interface{}
	err := _Abi.contract.Call(opts, &out, "supportsInterface", interfaceId)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// SupportsInterface is a free data retrieval call binding the contract method 0x01ffc9a7.
//
// Solidity: function supportsInterface(bytes4 interfaceId) view returns(bool)
func (_Abi *AbiSession) SupportsInterface(interfaceId [4]byte) (bool, error) {
	return _Abi.Contract.SupportsInterface(&_Abi.CallOpts, interfaceId)
}

// SupportsInterface is a free data retrieval call binding the contract method 0x01ffc9a7.
//
// Solidity: function supportsInterface(bytes4 interfaceId) view returns(bool)
func (_Abi *AbiCallerSession) SupportsInterface(interfaceId [4]byte) (bool, error) {
	return _Abi.Contract.SupportsInterface(&_Abi.CallOpts, interfaceId)
}

// Users is a free data retrieval call binding the contract method 0xb9d02df4.
//
// Solidity: function users(uint256 , address ) view returns(uint256 amountTotal, uint256 unclaimedRewards)
func (_Abi *AbiCaller) Users(opts *bind.CallOpts, arg0 *big.Int, arg1 common.Address) (struct {
	AmountTotal      *big.Int
	UnclaimedRewards *big.Int
}, error) {
	var out []interface{}
	err := _Abi.contract.Call(opts, &out, "users", arg0, arg1)

	outstruct := new(struct {
		AmountTotal      *big.Int
		UnclaimedRewards *big.Int
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.AmountTotal = *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)
	outstruct.UnclaimedRewards = *abi.ConvertType(out[1], new(*big.Int)).(**big.Int)

	return *outstruct, err

}

// Users is a free data retrieval call binding the contract method 0xb9d02df4.
//
// Solidity: function users(uint256 , address ) view returns(uint256 amountTotal, uint256 unclaimedRewards)
func (_Abi *AbiSession) Users(arg0 *big.Int, arg1 common.Address) (struct {
	AmountTotal      *big.Int
	UnclaimedRewards *big.Int
}, error) {
	return _Abi.Contract.Users(&_Abi.CallOpts, arg0, arg1)
}

// Users is a free data retrieval call binding the contract method 0xb9d02df4.
//
// Solidity: function users(uint256 , address ) view returns(uint256 amountTotal, uint256 unclaimedRewards)
func (_Abi *AbiCallerSession) Users(arg0 *big.Int, arg1 common.Address) (struct {
	AmountTotal      *big.Int
	UnclaimedRewards *big.Int
}, error) {
	return _Abi.Contract.Users(&_Abi.CallOpts, arg0, arg1)
}

// AddPool is a paid mutator transaction binding the contract method 0x20edea2b.
//
// Solidity: function addPool(string _poolName, address _tokenAddress, uint256 _lockDuration, address oracleDataFeedAddress, uint256 sharePrice, uint256 feeRatio) returns()
func (_Abi *AbiTransactor) AddPool(opts *bind.TransactOpts, _poolName string, _tokenAddress common.Address, _lockDuration *big.Int, oracleDataFeedAddress common.Address, sharePrice *big.Int, feeRatio *big.Int) (*types.Transaction, error) {
	return _Abi.contract.Transact(opts, "addPool", _poolName, _tokenAddress, _lockDuration, oracleDataFeedAddress, sharePrice, feeRatio)
}

// AddPool is a paid mutator transaction binding the contract method 0x20edea2b.
//
// Solidity: function addPool(string _poolName, address _tokenAddress, uint256 _lockDuration, address oracleDataFeedAddress, uint256 sharePrice, uint256 feeRatio) returns()
func (_Abi *AbiSession) AddPool(_poolName string, _tokenAddress common.Address, _lockDuration *big.Int, oracleDataFeedAddress common.Address, sharePrice *big.Int, feeRatio *big.Int) (*types.Transaction, error) {
	return _Abi.Contract.AddPool(&_Abi.TransactOpts, _poolName, _tokenAddress, _lockDuration, oracleDataFeedAddress, sharePrice, feeRatio)
}

// AddPool is a paid mutator transaction binding the contract method 0x20edea2b.
//
// Solidity: function addPool(string _poolName, address _tokenAddress, uint256 _lockDuration, address oracleDataFeedAddress, uint256 sharePrice, uint256 feeRatio) returns()
func (_Abi *AbiTransactorSession) AddPool(_poolName string, _tokenAddress common.Address, _lockDuration *big.Int, oracleDataFeedAddress common.Address, sharePrice *big.Int, feeRatio *big.Int) (*types.Transaction, error) {
	return _Abi.Contract.AddPool(&_Abi.TransactOpts, _poolName, _tokenAddress, _lockDuration, oracleDataFeedAddress, sharePrice, feeRatio)
}

// ClaimRewards is a paid mutator transaction binding the contract method 0x0962ef79.
//
// Solidity: function claimRewards(uint256 _poolId) returns()
func (_Abi *AbiTransactor) ClaimRewards(opts *bind.TransactOpts, _poolId *big.Int) (*types.Transaction, error) {
	return _Abi.contract.Transact(opts, "claimRewards", _poolId)
}

// ClaimRewards is a paid mutator transaction binding the contract method 0x0962ef79.
//
// Solidity: function claimRewards(uint256 _poolId) returns()
func (_Abi *AbiSession) ClaimRewards(_poolId *big.Int) (*types.Transaction, error) {
	return _Abi.Contract.ClaimRewards(&_Abi.TransactOpts, _poolId)
}

// ClaimRewards is a paid mutator transaction binding the contract method 0x0962ef79.
//
// Solidity: function claimRewards(uint256 _poolId) returns()
func (_Abi *AbiTransactorSession) ClaimRewards(_poolId *big.Int) (*types.Transaction, error) {
	return _Abi.Contract.ClaimRewards(&_Abi.TransactOpts, _poolId)
}

// Deposit is a paid mutator transaction binding the contract method 0xe2bbb158.
//
// Solidity: function deposit(uint256 _poolId, uint256 _amount) returns()
func (_Abi *AbiTransactor) Deposit(opts *bind.TransactOpts, _poolId *big.Int, _amount *big.Int) (*types.Transaction, error) {
	return _Abi.contract.Transact(opts, "deposit", _poolId, _amount)
}

// Deposit is a paid mutator transaction binding the contract method 0xe2bbb158.
//
// Solidity: function deposit(uint256 _poolId, uint256 _amount) returns()
func (_Abi *AbiSession) Deposit(_poolId *big.Int, _amount *big.Int) (*types.Transaction, error) {
	return _Abi.Contract.Deposit(&_Abi.TransactOpts, _poolId, _amount)
}

// Deposit is a paid mutator transaction binding the contract method 0xe2bbb158.
//
// Solidity: function deposit(uint256 _poolId, uint256 _amount) returns()
func (_Abi *AbiTransactorSession) Deposit(_poolId *big.Int, _amount *big.Int) (*types.Transaction, error) {
	return _Abi.Contract.Deposit(&_Abi.TransactOpts, _poolId, _amount)
}

// DepositEth is a paid mutator transaction binding the contract method 0x0f4d14e9.
//
// Solidity: function depositEth(uint256 _poolId) payable returns()
func (_Abi *AbiTransactor) DepositEth(opts *bind.TransactOpts, _poolId *big.Int) (*types.Transaction, error) {
	return _Abi.contract.Transact(opts, "depositEth", _poolId)
}

// DepositEth is a paid mutator transaction binding the contract method 0x0f4d14e9.
//
// Solidity: function depositEth(uint256 _poolId) payable returns()
func (_Abi *AbiSession) DepositEth(_poolId *big.Int) (*types.Transaction, error) {
	return _Abi.Contract.DepositEth(&_Abi.TransactOpts, _poolId)
}

// DepositEth is a paid mutator transaction binding the contract method 0x0f4d14e9.
//
// Solidity: function depositEth(uint256 _poolId) payable returns()
func (_Abi *AbiTransactorSession) DepositEth(_poolId *big.Int) (*types.Transaction, error) {
	return _Abi.Contract.DepositEth(&_Abi.TransactOpts, _poolId)
}

// GrantRole is a paid mutator transaction binding the contract method 0x2f2ff15d.
//
// Solidity: function grantRole(bytes32 role, address account) returns()
func (_Abi *AbiTransactor) GrantRole(opts *bind.TransactOpts, role [32]byte, account common.Address) (*types.Transaction, error) {
	return _Abi.contract.Transact(opts, "grantRole", role, account)
}

// GrantRole is a paid mutator transaction binding the contract method 0x2f2ff15d.
//
// Solidity: function grantRole(bytes32 role, address account) returns()
func (_Abi *AbiSession) GrantRole(role [32]byte, account common.Address) (*types.Transaction, error) {
	return _Abi.Contract.GrantRole(&_Abi.TransactOpts, role, account)
}

// GrantRole is a paid mutator transaction binding the contract method 0x2f2ff15d.
//
// Solidity: function grantRole(bytes32 role, address account) returns()
func (_Abi *AbiTransactorSession) GrantRole(role [32]byte, account common.Address) (*types.Transaction, error) {
	return _Abi.Contract.GrantRole(&_Abi.TransactOpts, role, account)
}

// Initialize is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_Abi *AbiTransactor) Initialize(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Abi.contract.Transact(opts, "initialize")
}

// Initialize is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_Abi *AbiSession) Initialize() (*types.Transaction, error) {
	return _Abi.Contract.Initialize(&_Abi.TransactOpts)
}

// Initialize is a paid mutator transaction binding the contract method 0x8129fc1c.
//
// Solidity: function initialize() returns()
func (_Abi *AbiTransactorSession) Initialize() (*types.Transaction, error) {
	return _Abi.Contract.Initialize(&_Abi.TransactOpts)
}

// Pause is a paid mutator transaction binding the contract method 0x8456cb59.
//
// Solidity: function pause() returns()
func (_Abi *AbiTransactor) Pause(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Abi.contract.Transact(opts, "pause")
}

// Pause is a paid mutator transaction binding the contract method 0x8456cb59.
//
// Solidity: function pause() returns()
func (_Abi *AbiSession) Pause() (*types.Transaction, error) {
	return _Abi.Contract.Pause(&_Abi.TransactOpts)
}

// Pause is a paid mutator transaction binding the contract method 0x8456cb59.
//
// Solidity: function pause() returns()
func (_Abi *AbiTransactorSession) Pause() (*types.Transaction, error) {
	return _Abi.Contract.Pause(&_Abi.TransactOpts)
}

// RenounceRole is a paid mutator transaction binding the contract method 0x36568abe.
//
// Solidity: function renounceRole(bytes32 role, address callerConfirmation) returns()
func (_Abi *AbiTransactor) RenounceRole(opts *bind.TransactOpts, role [32]byte, callerConfirmation common.Address) (*types.Transaction, error) {
	return _Abi.contract.Transact(opts, "renounceRole", role, callerConfirmation)
}

// RenounceRole is a paid mutator transaction binding the contract method 0x36568abe.
//
// Solidity: function renounceRole(bytes32 role, address callerConfirmation) returns()
func (_Abi *AbiSession) RenounceRole(role [32]byte, callerConfirmation common.Address) (*types.Transaction, error) {
	return _Abi.Contract.RenounceRole(&_Abi.TransactOpts, role, callerConfirmation)
}

// RenounceRole is a paid mutator transaction binding the contract method 0x36568abe.
//
// Solidity: function renounceRole(bytes32 role, address callerConfirmation) returns()
func (_Abi *AbiTransactorSession) RenounceRole(role [32]byte, callerConfirmation common.Address) (*types.Transaction, error) {
	return _Abi.Contract.RenounceRole(&_Abi.TransactOpts, role, callerConfirmation)
}

// RevokeRole is a paid mutator transaction binding the contract method 0xd547741f.
//
// Solidity: function revokeRole(bytes32 role, address account) returns()
func (_Abi *AbiTransactor) RevokeRole(opts *bind.TransactOpts, role [32]byte, account common.Address) (*types.Transaction, error) {
	return _Abi.contract.Transact(opts, "revokeRole", role, account)
}

// RevokeRole is a paid mutator transaction binding the contract method 0xd547741f.
//
// Solidity: function revokeRole(bytes32 role, address account) returns()
func (_Abi *AbiSession) RevokeRole(role [32]byte, account common.Address) (*types.Transaction, error) {
	return _Abi.Contract.RevokeRole(&_Abi.TransactOpts, role, account)
}

// RevokeRole is a paid mutator transaction binding the contract method 0xd547741f.
//
// Solidity: function revokeRole(bytes32 role, address account) returns()
func (_Abi *AbiTransactorSession) RevokeRole(role [32]byte, account common.Address) (*types.Transaction, error) {
	return _Abi.Contract.RevokeRole(&_Abi.TransactOpts, role, account)
}

// SetDailySharePrice is a paid mutator transaction binding the contract method 0x90d8d34d.
//
// Solidity: function setDailySharePrice(uint256 _poolId, uint256 _date, uint256 _price) returns()
func (_Abi *AbiTransactor) SetDailySharePrice(opts *bind.TransactOpts, _poolId *big.Int, _date *big.Int, _price *big.Int) (*types.Transaction, error) {
	return _Abi.contract.Transact(opts, "setDailySharePrice", _poolId, _date, _price)
}

// SetDailySharePrice is a paid mutator transaction binding the contract method 0x90d8d34d.
//
// Solidity: function setDailySharePrice(uint256 _poolId, uint256 _date, uint256 _price) returns()
func (_Abi *AbiSession) SetDailySharePrice(_poolId *big.Int, _date *big.Int, _price *big.Int) (*types.Transaction, error) {
	return _Abi.Contract.SetDailySharePrice(&_Abi.TransactOpts, _poolId, _date, _price)
}

// SetDailySharePrice is a paid mutator transaction binding the contract method 0x90d8d34d.
//
// Solidity: function setDailySharePrice(uint256 _poolId, uint256 _date, uint256 _price) returns()
func (_Abi *AbiTransactorSession) SetDailySharePrice(_poolId *big.Int, _date *big.Int, _price *big.Int) (*types.Transaction, error) {
	return _Abi.Contract.SetDailySharePrice(&_Abi.TransactOpts, _poolId, _date, _price)
}

// SetPoolActive is a paid mutator transaction binding the contract method 0xea17fa93.
//
// Solidity: function setPoolActive(uint256 _poolId, bool _isActive) returns()
func (_Abi *AbiTransactor) SetPoolActive(opts *bind.TransactOpts, _poolId *big.Int, _isActive bool) (*types.Transaction, error) {
	return _Abi.contract.Transact(opts, "setPoolActive", _poolId, _isActive)
}

// SetPoolActive is a paid mutator transaction binding the contract method 0xea17fa93.
//
// Solidity: function setPoolActive(uint256 _poolId, bool _isActive) returns()
func (_Abi *AbiSession) SetPoolActive(_poolId *big.Int, _isActive bool) (*types.Transaction, error) {
	return _Abi.Contract.SetPoolActive(&_Abi.TransactOpts, _poolId, _isActive)
}

// SetPoolActive is a paid mutator transaction binding the contract method 0xea17fa93.
//
// Solidity: function setPoolActive(uint256 _poolId, bool _isActive) returns()
func (_Abi *AbiTransactorSession) SetPoolActive(_poolId *big.Int, _isActive bool) (*types.Transaction, error) {
	return _Abi.Contract.SetPoolActive(&_Abi.TransactOpts, _poolId, _isActive)
}

// Unpause is a paid mutator transaction binding the contract method 0x3f4ba83a.
//
// Solidity: function unpause() returns()
func (_Abi *AbiTransactor) Unpause(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Abi.contract.Transact(opts, "unpause")
}

// Unpause is a paid mutator transaction binding the contract method 0x3f4ba83a.
//
// Solidity: function unpause() returns()
func (_Abi *AbiSession) Unpause() (*types.Transaction, error) {
	return _Abi.Contract.Unpause(&_Abi.TransactOpts)
}

// Unpause is a paid mutator transaction binding the contract method 0x3f4ba83a.
//
// Solidity: function unpause() returns()
func (_Abi *AbiTransactorSession) Unpause() (*types.Transaction, error) {
	return _Abi.Contract.Unpause(&_Abi.TransactOpts)
}

// UpgradeToAndCall is a paid mutator transaction binding the contract method 0x4f1ef286.
//
// Solidity: function upgradeToAndCall(address newImplementation, bytes data) payable returns()
func (_Abi *AbiTransactor) UpgradeToAndCall(opts *bind.TransactOpts, newImplementation common.Address, data []byte) (*types.Transaction, error) {
	return _Abi.contract.Transact(opts, "upgradeToAndCall", newImplementation, data)
}

// UpgradeToAndCall is a paid mutator transaction binding the contract method 0x4f1ef286.
//
// Solidity: function upgradeToAndCall(address newImplementation, bytes data) payable returns()
func (_Abi *AbiSession) UpgradeToAndCall(newImplementation common.Address, data []byte) (*types.Transaction, error) {
	return _Abi.Contract.UpgradeToAndCall(&_Abi.TransactOpts, newImplementation, data)
}

// UpgradeToAndCall is a paid mutator transaction binding the contract method 0x4f1ef286.
//
// Solidity: function upgradeToAndCall(address newImplementation, bytes data) payable returns()
func (_Abi *AbiTransactorSession) UpgradeToAndCall(newImplementation common.Address, data []byte) (*types.Transaction, error) {
	return _Abi.Contract.UpgradeToAndCall(&_Abi.TransactOpts, newImplementation, data)
}

// Withdraw is a paid mutator transaction binding the contract method 0x441a3e70.
//
// Solidity: function withdraw(uint256 _poolId, uint256 _amount) returns()
func (_Abi *AbiTransactor) Withdraw(opts *bind.TransactOpts, _poolId *big.Int, _amount *big.Int) (*types.Transaction, error) {
	return _Abi.contract.Transact(opts, "withdraw", _poolId, _amount)
}

// Withdraw is a paid mutator transaction binding the contract method 0x441a3e70.
//
// Solidity: function withdraw(uint256 _poolId, uint256 _amount) returns()
func (_Abi *AbiSession) Withdraw(_poolId *big.Int, _amount *big.Int) (*types.Transaction, error) {
	return _Abi.Contract.Withdraw(&_Abi.TransactOpts, _poolId, _amount)
}

// Withdraw is a paid mutator transaction binding the contract method 0x441a3e70.
//
// Solidity: function withdraw(uint256 _poolId, uint256 _amount) returns()
func (_Abi *AbiTransactorSession) Withdraw(_poolId *big.Int, _amount *big.Int) (*types.Transaction, error) {
	return _Abi.Contract.Withdraw(&_Abi.TransactOpts, _poolId, _amount)
}

// AbiClaimRewardsIterator is returned from FilterClaimRewards and is used to iterate over the raw logs and unpacked data for ClaimRewards events raised by the Abi contract.
type AbiClaimRewardsIterator struct {
	Event *AbiClaimRewards // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *AbiClaimRewardsIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(AbiClaimRewards)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(AbiClaimRewards)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *AbiClaimRewardsIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *AbiClaimRewardsIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// AbiClaimRewards represents a ClaimRewards event raised by the Abi contract.
type AbiClaimRewards struct {
	User      common.Address
	PoolId    *big.Int
	Reward    *big.Int
	ClaimedAt *big.Int
	Raw       types.Log // Blockchain specific contextual infos
}

// FilterClaimRewards is a free log retrieval operation binding the contract event 0x3c09a2b3e58d6395c26eccb9ac4a6f743daa1235eb4ae606bd8b63e7a7b3baac.
//
// Solidity: event ClaimRewards(address indexed user, uint256 indexed poolId, uint256 reward, uint256 claimedAt)
func (_Abi *AbiFilterer) FilterClaimRewards(opts *bind.FilterOpts, user []common.Address, poolId []*big.Int) (*AbiClaimRewardsIterator, error) {

	var userRule []interface{}
	for _, userItem := range user {
		userRule = append(userRule, userItem)
	}
	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Abi.contract.FilterLogs(opts, "ClaimRewards", userRule, poolIdRule)
	if err != nil {
		return nil, err
	}
	return &AbiClaimRewardsIterator{contract: _Abi.contract, event: "ClaimRewards", logs: logs, sub: sub}, nil
}

// WatchClaimRewards is a free log subscription operation binding the contract event 0x3c09a2b3e58d6395c26eccb9ac4a6f743daa1235eb4ae606bd8b63e7a7b3baac.
//
// Solidity: event ClaimRewards(address indexed user, uint256 indexed poolId, uint256 reward, uint256 claimedAt)
func (_Abi *AbiFilterer) WatchClaimRewards(opts *bind.WatchOpts, sink chan<- *AbiClaimRewards, user []common.Address, poolId []*big.Int) (event.Subscription, error) {

	var userRule []interface{}
	for _, userItem := range user {
		userRule = append(userRule, userItem)
	}
	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Abi.contract.WatchLogs(opts, "ClaimRewards", userRule, poolIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(AbiClaimRewards)
				if err := _Abi.contract.UnpackLog(event, "ClaimRewards", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseClaimRewards is a log parse operation binding the contract event 0x3c09a2b3e58d6395c26eccb9ac4a6f743daa1235eb4ae606bd8b63e7a7b3baac.
//
// Solidity: event ClaimRewards(address indexed user, uint256 indexed poolId, uint256 reward, uint256 claimedAt)
func (_Abi *AbiFilterer) ParseClaimRewards(log types.Log) (*AbiClaimRewards, error) {
	event := new(AbiClaimRewards)
	if err := _Abi.contract.UnpackLog(event, "ClaimRewards", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// AbiInitializedIterator is returned from FilterInitialized and is used to iterate over the raw logs and unpacked data for Initialized events raised by the Abi contract.
type AbiInitializedIterator struct {
	Event *AbiInitialized // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *AbiInitializedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(AbiInitialized)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(AbiInitialized)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *AbiInitializedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *AbiInitializedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// AbiInitialized represents a Initialized event raised by the Abi contract.
type AbiInitialized struct {
	Version uint64
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterInitialized is a free log retrieval operation binding the contract event 0xc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d2.
//
// Solidity: event Initialized(uint64 version)
func (_Abi *AbiFilterer) FilterInitialized(opts *bind.FilterOpts) (*AbiInitializedIterator, error) {

	logs, sub, err := _Abi.contract.FilterLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return &AbiInitializedIterator{contract: _Abi.contract, event: "Initialized", logs: logs, sub: sub}, nil
}

// WatchInitialized is a free log subscription operation binding the contract event 0xc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d2.
//
// Solidity: event Initialized(uint64 version)
func (_Abi *AbiFilterer) WatchInitialized(opts *bind.WatchOpts, sink chan<- *AbiInitialized) (event.Subscription, error) {

	logs, sub, err := _Abi.contract.WatchLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(AbiInitialized)
				if err := _Abi.contract.UnpackLog(event, "Initialized", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseInitialized is a log parse operation binding the contract event 0xc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d2.
//
// Solidity: event Initialized(uint64 version)
func (_Abi *AbiFilterer) ParseInitialized(log types.Log) (*AbiInitialized, error) {
	event := new(AbiInitialized)
	if err := _Abi.contract.UnpackLog(event, "Initialized", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// AbiPausedIterator is returned from FilterPaused and is used to iterate over the raw logs and unpacked data for Paused events raised by the Abi contract.
type AbiPausedIterator struct {
	Event *AbiPaused // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *AbiPausedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(AbiPaused)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(AbiPaused)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *AbiPausedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *AbiPausedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// AbiPaused represents a Paused event raised by the Abi contract.
type AbiPaused struct {
	Account common.Address
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterPaused is a free log retrieval operation binding the contract event 0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258.
//
// Solidity: event Paused(address account)
func (_Abi *AbiFilterer) FilterPaused(opts *bind.FilterOpts) (*AbiPausedIterator, error) {

	logs, sub, err := _Abi.contract.FilterLogs(opts, "Paused")
	if err != nil {
		return nil, err
	}
	return &AbiPausedIterator{contract: _Abi.contract, event: "Paused", logs: logs, sub: sub}, nil
}

// WatchPaused is a free log subscription operation binding the contract event 0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258.
//
// Solidity: event Paused(address account)
func (_Abi *AbiFilterer) WatchPaused(opts *bind.WatchOpts, sink chan<- *AbiPaused) (event.Subscription, error) {

	logs, sub, err := _Abi.contract.WatchLogs(opts, "Paused")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(AbiPaused)
				if err := _Abi.contract.UnpackLog(event, "Paused", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParsePaused is a log parse operation binding the contract event 0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258.
//
// Solidity: event Paused(address account)
func (_Abi *AbiFilterer) ParsePaused(log types.Log) (*AbiPaused, error) {
	event := new(AbiPaused)
	if err := _Abi.contract.UnpackLog(event, "Paused", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// AbiPoolCreatedIterator is returned from FilterPoolCreated and is used to iterate over the raw logs and unpacked data for PoolCreated events raised by the Abi contract.
type AbiPoolCreatedIterator struct {
	Event *AbiPoolCreated // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *AbiPoolCreatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(AbiPoolCreated)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(AbiPoolCreated)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *AbiPoolCreatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *AbiPoolCreatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// AbiPoolCreated represents a PoolCreated event raised by the Abi contract.
type AbiPoolCreated struct {
	PoolId       *big.Int
	Token        common.Address
	LockDuration *big.Int
	Name         string
	Raw          types.Log // Blockchain specific contextual infos
}

// FilterPoolCreated is a free log retrieval operation binding the contract event 0xdf71b8020a8665c1e659fdb220a8f1e611d1466d4c1f972c551fde4b3c0e1c28.
//
// Solidity: event PoolCreated(uint256 indexed poolId, address indexed token, uint256 lockDuration, string name)
func (_Abi *AbiFilterer) FilterPoolCreated(opts *bind.FilterOpts, poolId []*big.Int, token []common.Address) (*AbiPoolCreatedIterator, error) {

	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}
	var tokenRule []interface{}
	for _, tokenItem := range token {
		tokenRule = append(tokenRule, tokenItem)
	}

	logs, sub, err := _Abi.contract.FilterLogs(opts, "PoolCreated", poolIdRule, tokenRule)
	if err != nil {
		return nil, err
	}
	return &AbiPoolCreatedIterator{contract: _Abi.contract, event: "PoolCreated", logs: logs, sub: sub}, nil
}

// WatchPoolCreated is a free log subscription operation binding the contract event 0xdf71b8020a8665c1e659fdb220a8f1e611d1466d4c1f972c551fde4b3c0e1c28.
//
// Solidity: event PoolCreated(uint256 indexed poolId, address indexed token, uint256 lockDuration, string name)
func (_Abi *AbiFilterer) WatchPoolCreated(opts *bind.WatchOpts, sink chan<- *AbiPoolCreated, poolId []*big.Int, token []common.Address) (event.Subscription, error) {

	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}
	var tokenRule []interface{}
	for _, tokenItem := range token {
		tokenRule = append(tokenRule, tokenItem)
	}

	logs, sub, err := _Abi.contract.WatchLogs(opts, "PoolCreated", poolIdRule, tokenRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(AbiPoolCreated)
				if err := _Abi.contract.UnpackLog(event, "PoolCreated", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParsePoolCreated is a log parse operation binding the contract event 0xdf71b8020a8665c1e659fdb220a8f1e611d1466d4c1f972c551fde4b3c0e1c28.
//
// Solidity: event PoolCreated(uint256 indexed poolId, address indexed token, uint256 lockDuration, string name)
func (_Abi *AbiFilterer) ParsePoolCreated(log types.Log) (*AbiPoolCreated, error) {
	event := new(AbiPoolCreated)
	if err := _Abi.contract.UnpackLog(event, "PoolCreated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// AbiRoleAdminChangedIterator is returned from FilterRoleAdminChanged and is used to iterate over the raw logs and unpacked data for RoleAdminChanged events raised by the Abi contract.
type AbiRoleAdminChangedIterator struct {
	Event *AbiRoleAdminChanged // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *AbiRoleAdminChangedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(AbiRoleAdminChanged)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(AbiRoleAdminChanged)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *AbiRoleAdminChangedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *AbiRoleAdminChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// AbiRoleAdminChanged represents a RoleAdminChanged event raised by the Abi contract.
type AbiRoleAdminChanged struct {
	Role              [32]byte
	PreviousAdminRole [32]byte
	NewAdminRole      [32]byte
	Raw               types.Log // Blockchain specific contextual infos
}

// FilterRoleAdminChanged is a free log retrieval operation binding the contract event 0xbd79b86ffe0ab8e8776151514217cd7cacd52c909f66475c3af44e129f0b00ff.
//
// Solidity: event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)
func (_Abi *AbiFilterer) FilterRoleAdminChanged(opts *bind.FilterOpts, role [][32]byte, previousAdminRole [][32]byte, newAdminRole [][32]byte) (*AbiRoleAdminChangedIterator, error) {

	var roleRule []interface{}
	for _, roleItem := range role {
		roleRule = append(roleRule, roleItem)
	}
	var previousAdminRoleRule []interface{}
	for _, previousAdminRoleItem := range previousAdminRole {
		previousAdminRoleRule = append(previousAdminRoleRule, previousAdminRoleItem)
	}
	var newAdminRoleRule []interface{}
	for _, newAdminRoleItem := range newAdminRole {
		newAdminRoleRule = append(newAdminRoleRule, newAdminRoleItem)
	}

	logs, sub, err := _Abi.contract.FilterLogs(opts, "RoleAdminChanged", roleRule, previousAdminRoleRule, newAdminRoleRule)
	if err != nil {
		return nil, err
	}
	return &AbiRoleAdminChangedIterator{contract: _Abi.contract, event: "RoleAdminChanged", logs: logs, sub: sub}, nil
}

// WatchRoleAdminChanged is a free log subscription operation binding the contract event 0xbd79b86ffe0ab8e8776151514217cd7cacd52c909f66475c3af44e129f0b00ff.
//
// Solidity: event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)
func (_Abi *AbiFilterer) WatchRoleAdminChanged(opts *bind.WatchOpts, sink chan<- *AbiRoleAdminChanged, role [][32]byte, previousAdminRole [][32]byte, newAdminRole [][32]byte) (event.Subscription, error) {

	var roleRule []interface{}
	for _, roleItem := range role {
		roleRule = append(roleRule, roleItem)
	}
	var previousAdminRoleRule []interface{}
	for _, previousAdminRoleItem := range previousAdminRole {
		previousAdminRoleRule = append(previousAdminRoleRule, previousAdminRoleItem)
	}
	var newAdminRoleRule []interface{}
	for _, newAdminRoleItem := range newAdminRole {
		newAdminRoleRule = append(newAdminRoleRule, newAdminRoleItem)
	}

	logs, sub, err := _Abi.contract.WatchLogs(opts, "RoleAdminChanged", roleRule, previousAdminRoleRule, newAdminRoleRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(AbiRoleAdminChanged)
				if err := _Abi.contract.UnpackLog(event, "RoleAdminChanged", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseRoleAdminChanged is a log parse operation binding the contract event 0xbd79b86ffe0ab8e8776151514217cd7cacd52c909f66475c3af44e129f0b00ff.
//
// Solidity: event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)
func (_Abi *AbiFilterer) ParseRoleAdminChanged(log types.Log) (*AbiRoleAdminChanged, error) {
	event := new(AbiRoleAdminChanged)
	if err := _Abi.contract.UnpackLog(event, "RoleAdminChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// AbiRoleGrantedIterator is returned from FilterRoleGranted and is used to iterate over the raw logs and unpacked data for RoleGranted events raised by the Abi contract.
type AbiRoleGrantedIterator struct {
	Event *AbiRoleGranted // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *AbiRoleGrantedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(AbiRoleGranted)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(AbiRoleGranted)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *AbiRoleGrantedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *AbiRoleGrantedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// AbiRoleGranted represents a RoleGranted event raised by the Abi contract.
type AbiRoleGranted struct {
	Role    [32]byte
	Account common.Address
	Sender  common.Address
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterRoleGranted is a free log retrieval operation binding the contract event 0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d.
//
// Solidity: event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)
func (_Abi *AbiFilterer) FilterRoleGranted(opts *bind.FilterOpts, role [][32]byte, account []common.Address, sender []common.Address) (*AbiRoleGrantedIterator, error) {

	var roleRule []interface{}
	for _, roleItem := range role {
		roleRule = append(roleRule, roleItem)
	}
	var accountRule []interface{}
	for _, accountItem := range account {
		accountRule = append(accountRule, accountItem)
	}
	var senderRule []interface{}
	for _, senderItem := range sender {
		senderRule = append(senderRule, senderItem)
	}

	logs, sub, err := _Abi.contract.FilterLogs(opts, "RoleGranted", roleRule, accountRule, senderRule)
	if err != nil {
		return nil, err
	}
	return &AbiRoleGrantedIterator{contract: _Abi.contract, event: "RoleGranted", logs: logs, sub: sub}, nil
}

// WatchRoleGranted is a free log subscription operation binding the contract event 0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d.
//
// Solidity: event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)
func (_Abi *AbiFilterer) WatchRoleGranted(opts *bind.WatchOpts, sink chan<- *AbiRoleGranted, role [][32]byte, account []common.Address, sender []common.Address) (event.Subscription, error) {

	var roleRule []interface{}
	for _, roleItem := range role {
		roleRule = append(roleRule, roleItem)
	}
	var accountRule []interface{}
	for _, accountItem := range account {
		accountRule = append(accountRule, accountItem)
	}
	var senderRule []interface{}
	for _, senderItem := range sender {
		senderRule = append(senderRule, senderItem)
	}

	logs, sub, err := _Abi.contract.WatchLogs(opts, "RoleGranted", roleRule, accountRule, senderRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(AbiRoleGranted)
				if err := _Abi.contract.UnpackLog(event, "RoleGranted", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseRoleGranted is a log parse operation binding the contract event 0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d.
//
// Solidity: event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)
func (_Abi *AbiFilterer) ParseRoleGranted(log types.Log) (*AbiRoleGranted, error) {
	event := new(AbiRoleGranted)
	if err := _Abi.contract.UnpackLog(event, "RoleGranted", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// AbiRoleRevokedIterator is returned from FilterRoleRevoked and is used to iterate over the raw logs and unpacked data for RoleRevoked events raised by the Abi contract.
type AbiRoleRevokedIterator struct {
	Event *AbiRoleRevoked // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *AbiRoleRevokedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(AbiRoleRevoked)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(AbiRoleRevoked)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *AbiRoleRevokedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *AbiRoleRevokedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// AbiRoleRevoked represents a RoleRevoked event raised by the Abi contract.
type AbiRoleRevoked struct {
	Role    [32]byte
	Account common.Address
	Sender  common.Address
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterRoleRevoked is a free log retrieval operation binding the contract event 0xf6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b.
//
// Solidity: event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)
func (_Abi *AbiFilterer) FilterRoleRevoked(opts *bind.FilterOpts, role [][32]byte, account []common.Address, sender []common.Address) (*AbiRoleRevokedIterator, error) {

	var roleRule []interface{}
	for _, roleItem := range role {
		roleRule = append(roleRule, roleItem)
	}
	var accountRule []interface{}
	for _, accountItem := range account {
		accountRule = append(accountRule, accountItem)
	}
	var senderRule []interface{}
	for _, senderItem := range sender {
		senderRule = append(senderRule, senderItem)
	}

	logs, sub, err := _Abi.contract.FilterLogs(opts, "RoleRevoked", roleRule, accountRule, senderRule)
	if err != nil {
		return nil, err
	}
	return &AbiRoleRevokedIterator{contract: _Abi.contract, event: "RoleRevoked", logs: logs, sub: sub}, nil
}

// WatchRoleRevoked is a free log subscription operation binding the contract event 0xf6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b.
//
// Solidity: event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)
func (_Abi *AbiFilterer) WatchRoleRevoked(opts *bind.WatchOpts, sink chan<- *AbiRoleRevoked, role [][32]byte, account []common.Address, sender []common.Address) (event.Subscription, error) {

	var roleRule []interface{}
	for _, roleItem := range role {
		roleRule = append(roleRule, roleItem)
	}
	var accountRule []interface{}
	for _, accountItem := range account {
		accountRule = append(accountRule, accountItem)
	}
	var senderRule []interface{}
	for _, senderItem := range sender {
		senderRule = append(senderRule, senderItem)
	}

	logs, sub, err := _Abi.contract.WatchLogs(opts, "RoleRevoked", roleRule, accountRule, senderRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(AbiRoleRevoked)
				if err := _Abi.contract.UnpackLog(event, "RoleRevoked", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseRoleRevoked is a log parse operation binding the contract event 0xf6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b.
//
// Solidity: event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)
func (_Abi *AbiFilterer) ParseRoleRevoked(log types.Log) (*AbiRoleRevoked, error) {
	event := new(AbiRoleRevoked)
	if err := _Abi.contract.UnpackLog(event, "RoleRevoked", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// AbiSharePriceUpdatedIterator is returned from FilterSharePriceUpdated and is used to iterate over the raw logs and unpacked data for SharePriceUpdated events raised by the Abi contract.
type AbiSharePriceUpdatedIterator struct {
	Event *AbiSharePriceUpdated // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *AbiSharePriceUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(AbiSharePriceUpdated)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(AbiSharePriceUpdated)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *AbiSharePriceUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *AbiSharePriceUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// AbiSharePriceUpdated represents a SharePriceUpdated event raised by the Abi contract.
type AbiSharePriceUpdated struct {
	Date  *big.Int
	Price *big.Int
	Raw   types.Log // Blockchain specific contextual infos
}

// FilterSharePriceUpdated is a free log retrieval operation binding the contract event 0xe3745d81d1057cc6022e5875c5c2f8442e2548bfa6ecf8f966861d179a3b188f.
//
// Solidity: event SharePriceUpdated(uint256 date, uint256 price)
func (_Abi *AbiFilterer) FilterSharePriceUpdated(opts *bind.FilterOpts) (*AbiSharePriceUpdatedIterator, error) {

	logs, sub, err := _Abi.contract.FilterLogs(opts, "SharePriceUpdated")
	if err != nil {
		return nil, err
	}
	return &AbiSharePriceUpdatedIterator{contract: _Abi.contract, event: "SharePriceUpdated", logs: logs, sub: sub}, nil
}

// WatchSharePriceUpdated is a free log subscription operation binding the contract event 0xe3745d81d1057cc6022e5875c5c2f8442e2548bfa6ecf8f966861d179a3b188f.
//
// Solidity: event SharePriceUpdated(uint256 date, uint256 price)
func (_Abi *AbiFilterer) WatchSharePriceUpdated(opts *bind.WatchOpts, sink chan<- *AbiSharePriceUpdated) (event.Subscription, error) {

	logs, sub, err := _Abi.contract.WatchLogs(opts, "SharePriceUpdated")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(AbiSharePriceUpdated)
				if err := _Abi.contract.UnpackLog(event, "SharePriceUpdated", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseSharePriceUpdated is a log parse operation binding the contract event 0xe3745d81d1057cc6022e5875c5c2f8442e2548bfa6ecf8f966861d179a3b188f.
//
// Solidity: event SharePriceUpdated(uint256 date, uint256 price)
func (_Abi *AbiFilterer) ParseSharePriceUpdated(log types.Log) (*AbiSharePriceUpdated, error) {
	event := new(AbiSharePriceUpdated)
	if err := _Abi.contract.UnpackLog(event, "SharePriceUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// AbiStakedIterator is returned from FilterStaked and is used to iterate over the raw logs and unpacked data for Staked events raised by the Abi contract.
type AbiStakedIterator struct {
	Event *AbiStaked // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *AbiStakedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(AbiStaked)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(AbiStaked)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *AbiStakedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *AbiStakedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// AbiStaked represents a Staked event raised by the Abi contract.
type AbiStaked struct {
	User       common.Address
	PoolId     *big.Int
	Amount     *big.Int
	StakedAt   *big.Int
	UnlockTime *big.Int
	Raw        types.Log // Blockchain specific contextual infos
}

// FilterStaked is a free log retrieval operation binding the contract event 0x9cfd25589d1eb8ad71e342a86a8524e83522e3936c0803048c08f6d9ad974f40.
//
// Solidity: event Staked(address indexed user, uint256 indexed poolId, uint256 amount, uint256 stakedAt, uint256 unlockTime)
func (_Abi *AbiFilterer) FilterStaked(opts *bind.FilterOpts, user []common.Address, poolId []*big.Int) (*AbiStakedIterator, error) {

	var userRule []interface{}
	for _, userItem := range user {
		userRule = append(userRule, userItem)
	}
	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Abi.contract.FilterLogs(opts, "Staked", userRule, poolIdRule)
	if err != nil {
		return nil, err
	}
	return &AbiStakedIterator{contract: _Abi.contract, event: "Staked", logs: logs, sub: sub}, nil
}

// WatchStaked is a free log subscription operation binding the contract event 0x9cfd25589d1eb8ad71e342a86a8524e83522e3936c0803048c08f6d9ad974f40.
//
// Solidity: event Staked(address indexed user, uint256 indexed poolId, uint256 amount, uint256 stakedAt, uint256 unlockTime)
func (_Abi *AbiFilterer) WatchStaked(opts *bind.WatchOpts, sink chan<- *AbiStaked, user []common.Address, poolId []*big.Int) (event.Subscription, error) {

	var userRule []interface{}
	for _, userItem := range user {
		userRule = append(userRule, userItem)
	}
	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Abi.contract.WatchLogs(opts, "Staked", userRule, poolIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(AbiStaked)
				if err := _Abi.contract.UnpackLog(event, "Staked", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseStaked is a log parse operation binding the contract event 0x9cfd25589d1eb8ad71e342a86a8524e83522e3936c0803048c08f6d9ad974f40.
//
// Solidity: event Staked(address indexed user, uint256 indexed poolId, uint256 amount, uint256 stakedAt, uint256 unlockTime)
func (_Abi *AbiFilterer) ParseStaked(log types.Log) (*AbiStaked, error) {
	event := new(AbiStaked)
	if err := _Abi.contract.UnpackLog(event, "Staked", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// AbiUnpausedIterator is returned from FilterUnpaused and is used to iterate over the raw logs and unpacked data for Unpaused events raised by the Abi contract.
type AbiUnpausedIterator struct {
	Event *AbiUnpaused // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *AbiUnpausedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(AbiUnpaused)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(AbiUnpaused)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *AbiUnpausedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *AbiUnpausedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// AbiUnpaused represents a Unpaused event raised by the Abi contract.
type AbiUnpaused struct {
	Account common.Address
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterUnpaused is a free log retrieval operation binding the contract event 0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa.
//
// Solidity: event Unpaused(address account)
func (_Abi *AbiFilterer) FilterUnpaused(opts *bind.FilterOpts) (*AbiUnpausedIterator, error) {

	logs, sub, err := _Abi.contract.FilterLogs(opts, "Unpaused")
	if err != nil {
		return nil, err
	}
	return &AbiUnpausedIterator{contract: _Abi.contract, event: "Unpaused", logs: logs, sub: sub}, nil
}

// WatchUnpaused is a free log subscription operation binding the contract event 0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa.
//
// Solidity: event Unpaused(address account)
func (_Abi *AbiFilterer) WatchUnpaused(opts *bind.WatchOpts, sink chan<- *AbiUnpaused) (event.Subscription, error) {

	logs, sub, err := _Abi.contract.WatchLogs(opts, "Unpaused")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(AbiUnpaused)
				if err := _Abi.contract.UnpackLog(event, "Unpaused", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseUnpaused is a log parse operation binding the contract event 0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa.
//
// Solidity: event Unpaused(address account)
func (_Abi *AbiFilterer) ParseUnpaused(log types.Log) (*AbiUnpaused, error) {
	event := new(AbiUnpaused)
	if err := _Abi.contract.UnpackLog(event, "Unpaused", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// AbiUpgradedIterator is returned from FilterUpgraded and is used to iterate over the raw logs and unpacked data for Upgraded events raised by the Abi contract.
type AbiUpgradedIterator struct {
	Event *AbiUpgraded // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *AbiUpgradedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(AbiUpgraded)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(AbiUpgraded)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *AbiUpgradedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *AbiUpgradedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// AbiUpgraded represents a Upgraded event raised by the Abi contract.
type AbiUpgraded struct {
	Implementation common.Address
	Raw            types.Log // Blockchain specific contextual infos
}

// FilterUpgraded is a free log retrieval operation binding the contract event 0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b.
//
// Solidity: event Upgraded(address indexed implementation)
func (_Abi *AbiFilterer) FilterUpgraded(opts *bind.FilterOpts, implementation []common.Address) (*AbiUpgradedIterator, error) {

	var implementationRule []interface{}
	for _, implementationItem := range implementation {
		implementationRule = append(implementationRule, implementationItem)
	}

	logs, sub, err := _Abi.contract.FilterLogs(opts, "Upgraded", implementationRule)
	if err != nil {
		return nil, err
	}
	return &AbiUpgradedIterator{contract: _Abi.contract, event: "Upgraded", logs: logs, sub: sub}, nil
}

// WatchUpgraded is a free log subscription operation binding the contract event 0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b.
//
// Solidity: event Upgraded(address indexed implementation)
func (_Abi *AbiFilterer) WatchUpgraded(opts *bind.WatchOpts, sink chan<- *AbiUpgraded, implementation []common.Address) (event.Subscription, error) {

	var implementationRule []interface{}
	for _, implementationItem := range implementation {
		implementationRule = append(implementationRule, implementationItem)
	}

	logs, sub, err := _Abi.contract.WatchLogs(opts, "Upgraded", implementationRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(AbiUpgraded)
				if err := _Abi.contract.UnpackLog(event, "Upgraded", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseUpgraded is a log parse operation binding the contract event 0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b.
//
// Solidity: event Upgraded(address indexed implementation)
func (_Abi *AbiFilterer) ParseUpgraded(log types.Log) (*AbiUpgraded, error) {
	event := new(AbiUpgraded)
	if err := _Abi.contract.UnpackLog(event, "Upgraded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// AbiWithdrawnIterator is returned from FilterWithdrawn and is used to iterate over the raw logs and unpacked data for Withdrawn events raised by the Abi contract.
type AbiWithdrawnIterator struct {
	Event *AbiWithdrawn // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *AbiWithdrawnIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(AbiWithdrawn)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(AbiWithdrawn)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *AbiWithdrawnIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *AbiWithdrawnIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// AbiWithdrawn represents a Withdrawn event raised by the Abi contract.
type AbiWithdrawn struct {
	User        common.Address
	PoolId      *big.Int
	Amount      *big.Int
	Reward      *big.Int
	WithdrawnAt *big.Int
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterWithdrawn is a free log retrieval operation binding the contract event 0x94ffd6b85c71b847775c89ef6496b93cee961bdc6ff827fd117f174f06f745ae.
//
// Solidity: event Withdrawn(address indexed user, uint256 indexed poolId, uint256 amount, uint256 reward, uint256 withdrawnAt)
func (_Abi *AbiFilterer) FilterWithdrawn(opts *bind.FilterOpts, user []common.Address, poolId []*big.Int) (*AbiWithdrawnIterator, error) {

	var userRule []interface{}
	for _, userItem := range user {
		userRule = append(userRule, userItem)
	}
	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Abi.contract.FilterLogs(opts, "Withdrawn", userRule, poolIdRule)
	if err != nil {
		return nil, err
	}
	return &AbiWithdrawnIterator{contract: _Abi.contract, event: "Withdrawn", logs: logs, sub: sub}, nil
}

// WatchWithdrawn is a free log subscription operation binding the contract event 0x94ffd6b85c71b847775c89ef6496b93cee961bdc6ff827fd117f174f06f745ae.
//
// Solidity: event Withdrawn(address indexed user, uint256 indexed poolId, uint256 amount, uint256 reward, uint256 withdrawnAt)
func (_Abi *AbiFilterer) WatchWithdrawn(opts *bind.WatchOpts, sink chan<- *AbiWithdrawn, user []common.Address, poolId []*big.Int) (event.Subscription, error) {

	var userRule []interface{}
	for _, userItem := range user {
		userRule = append(userRule, userItem)
	}
	var poolIdRule []interface{}
	for _, poolIdItem := range poolId {
		poolIdRule = append(poolIdRule, poolIdItem)
	}

	logs, sub, err := _Abi.contract.WatchLogs(opts, "Withdrawn", userRule, poolIdRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(AbiWithdrawn)
				if err := _Abi.contract.UnpackLog(event, "Withdrawn", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseWithdrawn is a log parse operation binding the contract event 0x94ffd6b85c71b847775c89ef6496b93cee961bdc6ff827fd117f174f06f745ae.
//
// Solidity: event Withdrawn(address indexed user, uint256 indexed poolId, uint256 amount, uint256 reward, uint256 withdrawnAt)
func (_Abi *AbiFilterer) ParseWithdrawn(log types.Log) (*AbiWithdrawn, error) {
	event := new(AbiWithdrawn)
	if err := _Abi.contract.UnpackLog(event, "Withdrawn", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
