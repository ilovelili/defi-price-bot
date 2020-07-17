require("dotenv").config();
const Web3 = require("web3");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const moment = require("moment-timezone");
const abi = require("./abi");
const address = require("./address");

const web3 = new Web3(new HDWalletProvider(process.env.PRIVATE_KEY, process.env.RPC_URL));
const uniswapFactoryContract = new web3.eth.Contract(abi.UNISWAP_FACTORY_ABI, address.UNISWAP_FACTORY_ADDRESS);
const kyberRateContract = new web3.eth.Contract(abi.KYBER_RATE_ABI, address.KYBER_RATE_ADDRESS);

async function checkPair(args) {
	const { inputTokenSymbol, inputTokenAddress, outputTokenSymbol, outputTokenAddress, inputAmount } = args;

	const exchangeAddress = await uniswapFactoryContract.methods.getExchange(outputTokenAddress).call();
	const exchangeContract = new web3.eth.Contract(abi.UNISWAP_EXCHANGE_ABI, exchangeAddress);

	const uniswapResult = await exchangeContract.methods.getEthToTokenInputPrice(inputAmount).call();
	let kyberResult = await kyberRateContract.methods.getExpectedRate(inputTokenAddress, outputTokenAddress, inputAmount, true).call();

	console.table([
		{
			"Input Token": inputTokenSymbol,
			"Output Token": outputTokenSymbol,
			"Input Amount": web3.utils.fromWei(inputAmount, "Ether"),
			"Uniswap Return": web3.utils.fromWei(uniswapResult, "Ether"),
			"Kyber Expected Rate": web3.utils.fromWei(kyberResult.expectedRate, "Ether"),
			"Kyber Min Return": web3.utils.fromWei(kyberResult.slippageRate, "Ether"),
			Timestamp: moment().tz("Japan/Tokyo").format(),
		},
	]);
}

let priceMonitor;
let monitoringPrice = false;

async function monitorPrice() {
	if (monitoringPrice) {
		return;
	}

	console.log("Checking prices...");
	monitoringPrice = true;

	try {
		// ADD YOUR CUSTOM TOKEN PAIRS HERE
		await checkPair({
			inputTokenSymbol: "ETH",
			inputTokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
			outputTokenSymbol: "DAI",
			outputTokenAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
			inputAmount: web3.utils.toWei("1", "ETHER"),
		});

		await checkPair({
			inputTokenSymbol: "ETH",
			inputTokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
			outputTokenSymbol: "KNC",
			outputTokenAddress: "0xdd974d5c2e2928dea5f71b9825b8b646686bd200",
			inputAmount: web3.utils.toWei("1", "ETHER"),
		});

		await checkPair({
			inputTokenSymbol: "ETH",
			inputTokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
			outputTokenSymbol: "LINK",
			outputTokenAddress: "0x514910771af9ca656af840dff83e8264ecf986ca",
			inputAmount: web3.utils.toWei("1", "ETHER"),
		});
	} catch (error) {
		console.error(error);
		monitoringPrice = false;
		clearInterval(priceMonitor);
		return;
	}

	monitoringPrice = false;
}

const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 3000;
priceMonitor = setInterval(async () => {
	await monitorPrice();
}, POLLING_INTERVAL);
