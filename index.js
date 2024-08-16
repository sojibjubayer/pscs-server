const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3jreq1p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        const productCollection = client.db('pscs').collection('products');

        app.get('/products', async (req, res) => {
            const page = parseInt(req.query.page) || 1; 
            const limit = parseInt(req.query.limit) || 12; 
            
            try {
                const totalProducts = await productCollection.countDocuments(); 
                const products = await productCollection.find()
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .toArray();
                
                res.json({
                    totalProducts,
                    page,
                    totalPages: Math.ceil(totalProducts / limit),
                    products
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch products' });
            }
        });

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    }

    process.on('SIGINT', async () => {
        await client.close();
        process.exit(0);
    });
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('pscs server is running');
});

app.listen(port, () => {
    console.log('Server is running at:', port);
});
