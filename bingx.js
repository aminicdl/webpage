const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

class BingX {
    constructor(apiKey, secretKey) {
        this.apiKey = apiKey;
        this.secretKey = secretKey;
        this.baseUrl = "https://api-swap-rest.bingbon.pro";
    }

    async getBalance(currency) {
        const timestamp = Date.now();
        const path = "/api/v1/user/getBalance";
        const paramString = `apiKey=${this.apiKey}&currency=${currency}&timestamp=${timestamp}`;
        const originString = `POST${path}${paramString}`;
        console.log(originString);
        const signature = crypto
            .createHmac("sha256", this.secretKey)
            .update(originString)
            .digest("base64");
        const url = `${
            this.baseUrl
        }${path}?${paramString}&sign=${encodeURIComponent(signature)}`;
        console.log(url);
        const response = await axios.post(url);
        return response.data;
    }

    async setLeverage(params) {
        const path = "/api/v1/user/setLeverage";
        const timestamp = Date.now();
        const symbol = params.symbol;
        const side = params.side;
        const leverage = params.leverage;

        const paramString = `apiKey=${this.apiKey}&leverage=${leverage}&side=${side}&symbol=${symbol}&timestamp=${timestamp}`;
        const originString = `POST${path}${paramString}`;
        console.log(originString);
        const signature = crypto
            .createHmac("sha256", this.secretKey)
            .update(originString)
            .digest("base64");
        const url = `${
            this.baseUrl
        }${path}?${paramString}&sign=${encodeURIComponent(signature)}`;
        console.log(url);
        const response = await axios.post(url);
        return response.data;
    }

    async getLeverage(params) {
        const path = "/api/v1/user/getLeverage";
        const timestamp = Date.now();
        const symbol = params.symbol;
        const paramString = `apiKey=${this.apiKey}&symbol=${symbol}&timestamp=${timestamp}`;
        const originString = `POST${path}${paramString}`;
        console.log(originString);
        const signature = crypto
            .createHmac("sha256", this.secretKey)
            .update(originString)
            .digest("base64");
        const url = `${
            this.baseUrl
        }${path}?${paramString}&sign=${encodeURIComponent(signature)}`;
        console.log(url);
        const response = await axios.post(url);
        return response.data;
    }

    async placeOrder(params) {
        const path = "/api/v1/user/trade";
        const timestamp = Date.now();
        const symbol = params.symbol;
        const side = params.side;
        const entrustPrice = params.entrustPrice;
        const entrustVolume = params.entrustVolume;
        const tradeType = params.tradeType;
        const action = params.action;
        const takerProfitPrice = params.takerProfitPrice ? params.takerProfitPrice : "";
        const stopLossPrice = params.stopLossPrice ? params.stopLossPrice : "";
        console.log(stopLossPrice);
        console.log(takerProfitPrice);
        const paramString = `action=${action}&apiKey=${this.apiKey}&entrustPrice=${entrustPrice}&entrustVolume=${entrustVolume}&side=${side}&stopLossPrice=${stopLossPrice}&symbol=${symbol}&takerProfitPrice=${takerProfitPrice}&timestamp=${timestamp}&tradeType=${tradeType}`
        // const paramString = `action=${action}&apiKey=${this.apiKey}&entrustPrice=${entrustPrice}&entrustVolume=${entrustVolume}&side=${side}&symbol=${symbol}&timestamp=${timestamp}&tradeType=${tradeType}`;
        const originString = `POST${path}${paramString}`;
        const signature = crypto
            .createHmac("sha256", this.secretKey)
            .update(originString)
            .digest("base64");

        const url = `${
            this.baseUrl
        }${path}?${paramString}&sign=${encodeURIComponent(signature)}`;

        console.log(url);
        const response = await axios.post(url);
        return response.data;
    }  

    // async getPositions(params) {
    //     const path = "/api/v1/user/getPositions";
    //     const timestamp = Date.now();
    //     const symbol = params.symbol;
    //     const paramString = `apiKey=${this.apiKey}&symbol=${symbol}&timestamp=${timestamp}`;
    //     const originString = `POST${path}${paramString}`;
    //     const signature = crypto
    //         .createHmac("sha256", this.secretKey)
    //         .update(originString)
    //         .digest("base64");
    //     const url = `${
    //         this.baseUrl
    //     }${path}?${paramString}&sign=${encodeURIComponent(signature)}`;
    //     const response = await axios.post(url);
    //     return response.data.data.positions;
    // }
        async getPositions(params) {
        const path = "/api/v1/user/getPositions";
        const timestamp = Date.now();
        const symbol = params.symbol;
        const paramString = `apiKey=${this.apiKey}&symbol=${symbol}&timestamp=${timestamp}`;
        const originString = `POST${path}${paramString}`;
        const signature = crypto
            .createHmac("sha256", this.secretKey)
            .update(originString)
            .digest("base64");
        const url = `${
            this.baseUrl
        }${path}?${paramString}&sign=${encodeURIComponent(signature)}`;
        const response = await axios.post(url);
        return response.data;
    }


    async closePositionBySymbol(symbol) {
        const position = await this.getPositions({ symbol: symbol });
        console.log(position)
        if (position.data.positions === null) {
            console.log("No position found for the symbol");
            return "No position found for the symbol";
        }
        else{
            const positionId = position.data.positions[0].positionId;
            const path = "/api/v1/user/oneClickClosePosition";
            const timestamp = Date.now();
            const paramString = `apiKey=${this.apiKey}&positionId=${positionId}&symbol=${symbol}&timestamp=${timestamp}`;
            const originString = `POST${path}${paramString}`;
            const signature = crypto
                .createHmac("sha256", this.secretKey)
                .update(originString)
                .digest("base64");
            const url = `${
                this.baseUrl
            }${path}?${paramString}&sign=${encodeURIComponent(signature)}`;
            console.log(url);
            const response = await axios.post(url);
            return response.data;

        }

    }

    // async getPrice(params) {
    //     const path = "api/v1/market/getLatestPrice";
    //     const timestamp = Date.now();
    //     const symbol = params.symbol;
    //     const paramString = `apiKey=${this.apiKey}&symbol=${symbol}&timestamp=${timestamp}`;
    //     const originString = `POST${path}${paramString}`;
    //     const signature = crypto
    //         .createHmac("sha256", this.secretKey)
    //         .update(originString)
    //         .digest("base64");
    //     const url = `${
    //         this.baseUrl
    //     }${path}?${paramString}&sign=${encodeURIComponent(signature)}`;
    //     const response = await axios.get(url);
    //     console.log(response.data)
    //     return response.data;
    // }

    async pendingStopOrders(params) {
        const position = await this.getPositions({ symbol: params.symbol });
        // console.log(position.data.positions[0].positionId)
        const positionId = position.data.positions[0].positionId;
        const path = "/api/v1/user/pendingStopOrders";
        const timestamp = Date.now();
        const symbol = params.symbol;
        const entrustVolume = params.entrustVolume;
        const takerProfitPrice = params.takerProfitPrice ? params.takerProfitPrice : "";
        const stopLossPrice = params.stopLossPrice ? params.stopLossPrice : "";
        const paramString = `apiKey=${this.apiKey}&entrustVolume=${entrustVolume}&positionId=${positionId}&stopLossPrice=${stopLossPrice}&symbol=${symbol}&takerProfitPrice=${takerProfitPrice}&timestamp=${timestamp}`;
        const originString = `POST${path}${paramString}`;
        const signature = crypto
            .createHmac("sha256", this.secretKey)
            .update(originString)
            .digest("base64");
        const url = `${
            this.baseUrl
        }${path}?${paramString}&sign=${encodeURIComponent(signature)}`;
        const response = await axios.post(url);
        return response.data;
    }

    async getPrice(params) {
        const path = "/api/v1/market/getLatestPrice";
        const symbol = params.symbol;
        const paramString = `symbol=${symbol}`;
        const totalPrice = await this.getBalance("USDT");
        const leverage = await this.getLeverage(({ symbol: params.symbol }));
        const originString = `GET${path}${paramString}`;
        const url = `${this.baseUrl}${path}?${paramString}`;
        const response = await axios.get(url);
        return {
            data: response.data,
            totalPrice: totalPrice,
            Leverage: leverage
        };
    }

    // async switchLeverage(params) {
    //     const path = "/api/v1/user/setLeverage";
    //     const timestamp = Date.now();
    //     const symbol = params.symbol;
    //     const side = params.side;
    //     const leverage = params.leverage;
    //     const paramString = `apiKey=${this.apiKey}&leverage=${leverage}&side=${side}&symbol=${symbol}&timestamp=${timestamp}`;
    //     const originString = `POST${path}${paramString}`;
    //     const signature = crypto
    //         .createHmac("sha256", this.secretKey)
    //         .update(originString)
    //         .digest("base64");
    //     const url = `${
    //         this.baseUrl
    //     }${path}?${paramString}&sign=${encodeURIComponent(signature)}`;
    //     const response = await axios.post(url);
    //     return response.data;
    // }

}

const bingx = new BingX(
    process.env.BINGX_API_KEY,
    process.env.BINGX_SECRET_KEY
);

// let tmp_params = {
//     entry_price: '0.1626',
//     sl: '0.165039',
//     tp_percent: '5.33',
//     rr: '1.08',
//     symbol: 'ALGOUSDT.PS',
//     tp_price: '0.1617363263',
//     position: 'short',
//     strategy: 'maj',
//     type: 'open_short'
//   }

//   bingx.placeOrder(tmp_params).then((data) => console.log(data));

// bingx.getBalance("USDT").then((data) => console.log(data));     //  balance


// bingx.getBalance("USDT").then((data) => console.log(data.data.account.balance /20));     //  balance


//////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////set Leverage
// bingx
//     .setLeverage({
//         symbol: "BNB-USDT",
//         side: "Long",
//         leverage: "10",
//     })
//     .then((data) => console.log(data));

// bingx
//     .setLeverage({
//         symbol: "BNB-USDT",
//         side: "Short",
//         leverage: "10",
//     })
//     .then((data) => console.log(data));

// bingx.getLeverage({ symbol: "BNB-USDT" }).then((data) => {
//     console.log(data);
    
// });

////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////// sell and tp sl


// bingx.getPrice({ symbol: "BNB-USDT" })
//   .then((data) => {
//     console.log(data)
//     const tradePrice1 = data.data.tradePrice;
//     const tradePrice = tradePrice1 - (tradePrice1 / 10000)
//     console.log(tradePrice)
//     bingx.placeOrder({
//       symbol: "BTC-USDT",
//       side: "Ask",
//       entrustPrice: tradePrice,
//       entrustVolume: "0.0003",
//       tradeType: "Limit",
//       action: "Open",
//       takerProfitPrice: "26871.00",
//       stopLossPrice: "26876.00",
//     })
//       .then((data) => {
//         console.log(data);
//       })
//       .catch((error) => {
//         console.error(error);
//       });
//   })
//   .catch((error) => {
//     console.error(error);
//   });

///////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////// sell and tp sl and balnce chek and set levarage
// bingx
//     .setLeverage({
//         symbol: "BNB-USDT",
//         side: "Short",
//         leverage: "5",
//     })
//     // .then((data) => console.log(data));

// bingx.getPrice({ symbol: "BNB-USDT" })
//   .then((result) => {
//     const data = result.data;
//     const totalPrice = result.totalPrice;
//     const leverage = result.Leverage.data.shortLeverage; //result.Leverage.data.longLeverage
//     console.log(leverage)
//     const volPrice = (totalPrice.data.account.balance / 20) * leverage
//     const tradePrice1 = data.data.tradePrice;
//     const tradePrice = tradePrice1 - (tradePrice1 / 10000)
//     const entrustVolume = volPrice / tradePrice
//     console.log(tradePrice)
//     console.log(volPrice)
//     console.log(entrustVolume)
//     bingx.placeOrder({
//       symbol: "BNB-USDT",
//       side: "Ask",
//       entrustPrice: tradePrice,
//       entrustVolume: entrustVolume,
//       tradeType: "Limit",
//       action: "Open",
//       takerProfitPrice: "309.00",
//       stopLossPrice: "309.30",
//     })
//       .then((data) => {
//         console.log(data);
//       })
//       .catch((error) => {
//         console.error(error);
//       });
//   })
//   .catch((error) => {
//     console.error(error);
//   });


/////////////////////////////////////////////////////////////////////////////////////// 


// bingx.pendingStopOrders({
//     symbol: "BNB-USDT",
//     entrustVolume: "0.02",
//     stopLossPrice: "309.60",
//     takeProfitPrice:"309",

// })
// .then((data) => {
//     console.log(data.data.orders);
// })
// .catch((error) => {
//     console.error(error);
// });

// bingx.getPositions({ symbol: "" }).then((data) => {
//     console.log(data.data.positions);
    // console.log(data.data.positions[0].positionId);
// });


// bingx.getPositions({ symbol: "" }).then((data) => {
//     console.log(data.data.positions);
//     console.log(data.data.positions[0].positionId);
// });

// bingx.pendingStopOrders({ symbol: "" }).then((data) => {
//     console.log(data.data.orders);
//     console.log(data.data.positions);
// });
/////////////////////////////////////////////////////////////////////////// close position

// bingx.closePositionBySymbol("BTC-USDT");   //  close position

/////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// test

// bingx 
//     .setLeverage({
//         symbol: "bnb-USDT",
//         side: "Long",
//         leverage: "2",
//     })
//     // .then((data) => console.log(data));

// const lev = bingx.getLeverage({ symbol: "BTC-USDT" }).then((data) => {
//     console.log(data);
    
// });

// bingx
//     .placeOrder({
//         symbol: "BNB-USDT",
//         side: "Ask",
//         entrustPrice: "308.80",
//         entrustVolume: "0.02",
//         tradeType: "Market",
//         action: "Open",
//         takerProfitPrice: "308.70",
//         stopLossPrice: "309.00",
//     })
//     .then((data) => {
//         console.log(data);
//     });

// bingx.placeOrder({
//     symbol: "BNB-USDT",
//     side: "Ask",
//     entrustPrice: "309.41",
//     entrustVolume: "0.02",
//     tradeType: "Market",
//     action: "Open",
//     stopLossPrice: "309.90",
//     takeProfitPrice:"309.10",

// })
// .then((data) => {
//     console.log(data);
// })
// .catch((error) => {
//     console.error(error);
// });
// bingx.switchLeverage({
//     symbol: "BNB-USDT",
//     side: "Long",
//     leverage: "10",

// })

// .then((data) => {
//     console.log(data);
// })
// .catch((error) => {
//     console.error(error);
// });

// bingx.switchLeverage({
//     symbol: "BNB-USDT",
//     side: "short",
//     leverage: "10",

// })

// .then((data) => {
//     console.log(data);
// })
// .catch((error) => {
//     console.error(error);
// });

// bingx.getPrice({ symbol: "BNB-USDT" })
//   .then((data,tradePrice) => {
//     console.log(data)
//     // const tradePrice1 = data.data.tradePrice;
//     // const tradePrice = tradePrice1 - (tradePrice1 / 10000)
//     console.log(totalPrice)
//     });

module.exports = BingX;
