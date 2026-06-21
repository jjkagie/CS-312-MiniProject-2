import express from "express"
import bodyParser from "body-parser"
import axios from "axios"
const app = express();
const port = 3000;
const cryptoURL = "https://api.coinpaprika.com/v1/tickers/";
const currencyURL = "https://api.frankfurter.dev/v2/rates?base=USD";

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ encoded: true }));

// api calls which will be used to dynamically create the dropdown menus
// for both the currencies and the crypto
const currencies = await axios.get( currencyURL );
let currencyList = [];
for(let index = 0; index < currencies.data.length; index++ ){
    currencyList.push( currencies.data[ index ].quote );
}

const cryptos = await axios.get( cryptoURL );
let cryptoList = [];
for( let index = 0; index < cryptos.data.length; index++ ){
    cryptoList.push({
        id: cryptos.data[ index ].id,
        name: cryptos.data[ index ].name,
        marketCap: cryptos.data[ index ].max_supply,
        supply: cryptos.data[ index ].total_supply
    });
}

app.get("/", (req, res) => {
    res.render("index.ejs", {
        cryptoList: cryptoList,
        currencyList: currencyList
    });
});

app.post("/", async (req, res) => {
    let url = cryptoURL + req.body["crypto"];
    const responseCrypto = await axios.get( url );
    const cryptoPrice = responseCrypto.data.quotes.USD.price;

    let currencyPrice = 0;
    // because USD is the base for the currency list, it isn't included
    if( req.body["currency"] === "USD" ){
        currencyPrice = 1;
    }
    else{
        url = currencyURL + `&quotes=${req.body["currency"]}`;
        const responseCurrency = await axios.get( url );
        currencyPrice = responseCurrency.data[0].rate;
    }
    
    res.render("index.ejs", {
        cryptoList: cryptoList,
        currencyList: currencyList,
        currentCrypto: req.body["crypto"],
        currentCurrency: req.body["currency"],
        price: cryptoPrice * currencyPrice
    });
    
});

app.post("/filter", (req, res) => {
    let marketCapMin = -1;
    let marketCapMax = 9999999999999999999999;
    let supplyMin = -1;
    let supplyMax = 9999999999999999999999;
    let filteredList = [];
    let filterChange = false;

    if( req.body["marketCapMin"] ){
        marketCapMin = req.body["marketCapMin"];
        filterChange = true;
    }
    if( req.body["marketCapMax"] ){
        marketCapMax = req.body["marketCapMax"];
        filterChange = true;
    }
    if( req.body["totalSupplyMin"] ){
        supplyMin = req.body["totalSupplyMin"];
        filterChange = true;
    }
    if( req.body["totalSupplyMax"] ){
        supplyMax = req.body["totalSupplyMax"];
        filterChange = true;
    }

    if( !filterChange ){
        res.redirect("/");
        return;
    }

    cryptoList.forEach((crypto) => {
        if( crypto.marketCap >= marketCapMin && crypto.marketCap <= marketCapMax &&
            crypto.supply >= supplyMin && crypto.supply <= supplyMax ){
            
            filteredList.push(crypto);
        }
    });

    res.render("index.ejs", {
        cryptoList: filteredList,
        currencyList: currencyList
    });

});


app.listen(port, () => {
    console.log(`Listening at ${port}`);
});