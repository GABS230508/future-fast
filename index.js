import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { MongoClient, ObjectId } from "mongodb";
import methodOverride from "method-override";
import multer from "multer";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import fs  from "fs";

const port = 3000;
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use(session({
    secret : 'asfkdhrhergeori',
    resave : false,
    saveUninitialized : true,
}));

app.use('/', express.static(join(__dirname, 'index.html')));

const MODEL_NAME = "gemini-pro";
const API_KEY = "AIzaSyC7vjjdlDEXJprQSB-DqLEo7HkVDJ6I3y4";

async function runChat(userInput) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 300,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: [
      {
        role: "user",
        parts: [{ text: "Você é um assistente virtual, que irá interagir com os pais sobre dúvidas da educação financeira para crianças. Sua função é ajudar eles dando dicas de como as crianças podem começar a mexer com o dinheiro e entender um pouco mais sobre essa parte da vida. Por meio de cursos, você pode entender mais como ajudar seu filho a manuzear o dinheiro. Temos alguns tipos de cursos, o gratuíto, Plus, Premium e o Gold. Cada um deles será um nível e um entendimento diferente sobre a Educação Financeira. E, você também pode ser um colaborador, podendo postar vídeos sobre o assunto e postar no nosso site. Lembre-se sempre de conversar com o usuário, como por exemplo saber a idade do seu filho, e o propósito dele aqui na KidPay, sabendo isso, podemos sim, começar a ajudar o cliente sobre tal assunto desejado. De acordo com a necessidade do cliente, oferecer um plano."}],
      },
      {
        role: "model",
        parts: [{ text: "Olá, sou seu assistente virtual. Minha função é auxiliar o manuzeamento sobre a educação financeira para crianças. Como posso ajudar?"}],
      },
      {
        role: "user",
        parts: [{ text: "Olá"}],
      },
    ],
  });

  const result = await chat.sendMessage(userInput);
  const response = result.response;
  return response.text();
}

app.post('/chat', async (req, res) => {
  try {
    const userInput = req.body?.userInput;
    console.log('incoming /chat req', req.body)
    if (!userInput) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await runChat(userInput);
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



const url = 'mongodb://127.0.0.1:27017/';
const dbName = 'kidpay';
const gratisCollection = 'gratis'
const plusCollection = 'plus';
const premiumCollection = 'premium';
const goldCollection = 'gold';
const colaboradorCollection = 'colaboradores';
const aulasGratisCollection = 'aulasGratis';
const aulasPlusCollection = 'aulasPlus';
const aulasPremiumCollection = 'aulasPremium';
const aulasGoldCollection = 'aulasGold';

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = 'uploads/';
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }
            cb(null, uploadDir);
        }
    });


const uploadGratis = multer({ storage: storage });
const uploadPlus = multer({ storage: storage });
const uploadPremium = multer({ storage: storage });
const uploadGold = multer({ storage: storage });

app.get('/gratis', (req, res) => {
    res.sendFile(__dirname + '/indexGratis.html')
})
app.get('/plus', (req, res) => {
    res.sendFile(__dirname + '/indexPlus.html')
});
app.get('/premium', (req, res) => {
    res.sendFile(__dirname + '/indexPremium.html')
});
app.get('/gold', (req, res) => {
    res.sendFile(__dirname + '/indexGold.html')
});
app.get('/colaborador', protegerRotaColaborador, (req, res) => {
    res.sendFile(__dirname + '/colaborador.html')
});
app.get('/cadastro', (req, res) => {
    res.sendFile(__dirname + '/cadastro.html')
});
app.get('/loginColaborador', (req, res) => {
    res.sendFile(__dirname + '/loginColaborador.html');
});
app.get('/cadastroColaborador', (req, res) => {
    res.sendFile(__dirname + '/cadastroColaborador.html');
});
app.get('/loginPlus', (req, res) => {
    res.sendFile(__dirname + '/loginPlus.html')
});
app.get('/loginPremium', (req, res) => {
    res.sendFile(__dirname + '/loginPremium.html')
});
app.get('/loginGold', (req, res) => {
    res.sendFile(__dirname + '/loginGold.html')
});
app.get('/loginGratis', (req, res) => {
    res.sendFile(__dirname + '/loginGratis.html')
});

//loginGratis
app.get('/profile', (req, res) => {
    res.sendFile(__dirname + '/profile.html')
});
app.get('/erroLogin', (req, res) => {
    res.sendFile(__dirname + '/erro.html')
});
app.get('/erroLoginColaborador', (req, res) => {
    res.sendFile(__dirname + '/erroColaborador.html')
});
app.get('/erroPlus', (req, res) => {
    res.sendFile(__dirname + '/erroPlus.html')
});
app.get('/erroPremium', (req, res) => {
    res.sendFile(__dirname + '/erroPremium.html')
});
app.get('/erroGold', (req, res) => {
    res.sendFile(__dirname + '/erroGold.html')
});

app.get('/sair', (req, res) => {
    req.session.destroy((err) => {
        if(err){
            return res.send('Erro ao sair!');
        }
        res.redirect('/');
    });
});

app.post('/cadastroColaborador', async (req, res) => {
    const client = new MongoClient(url, {useUnifiedTopology: true});
    try{
        await client.connect();
        const db = client.db(dbName);
        const colaborador = db.collection(colaboradorCollection);

        const colaboradorExistente = await colaborador.findOne({email: req.body.email});

        if(colaboradorExistente){
            res.send('Esse e-mail já está registrado. Tente outro.');
        } else {
            const senhaCriptografada = await bcrypt.hash(req.body.senha, 10);

            await colaborador.insertOne({
                email: req.body.email,
                senha: senhaCriptografada
            });
            res.redirect('/loginColaborador');
        }
    }catch(err){
        res.send('Erro ao registrar colaborador.');
    }finally{
        client.close();
    };
});

app.post('/loginColaborador', async (req, res) => {
    const client = new MongoClient(url, {useUnifiedTopology: true});
    try{
        await client.connect();
        const db = client.db(dbName);
        const colaborador = db.collection(colaboradorCollection);

        const email = await colaborador.findOne({email: req.body.email});

        if(email && await bcrypt.compare(req.body.senha, email.senha)){
            req.session.email = req.body.email;
            res.redirect('/colaborador');
        } else {
            res.redirect('/erroLoginColaborador');
        }
    } catch(err){
        res.send('Erro ao realizar login.');
    }finally{
        client.close();
    };
});

function protegerRotaColaborador(req, res, proximo){
    if(req.session.email){
        proximo();
    }else{
        res.redirect('/loginColaborador');
    }
};

//cadastroGratis
app.post('/loginGratis', async (req, res) => {
    const client = new MongoClient(url, {useUnifiedTopology: true});
    try{
        await client.connect();
        const db = client.db(dbName);
        const gratis = db.collection(gratisCollection);

        const email = await gratis.findOne({email: req.body.email});

        if(email && await bcrypt.compare(req.body.senha, email.senha)){
            req.session.email = req.body.email;
            res.redirect('/aulasGratis');
        } else {
            res.redirect('/erroLogin');
        }
    } catch(err){
        res.send('Erro ao realizar login.');
    }finally{
        client.close();
    };
});

app.post('/cadastroGratis', async (req, res) => {
    const client = new MongoClient(url, {useUnifiedTopology: true});
    try{
        await client.connect();
        const db = client.db(dbName);
        const gratis = db.collection(gratisCollection);

        const clienteGratisExistente = await gratis.findOne({email: req.body.email});

        if(clienteGratisExistente){
            res.send('Esse e-mail já está registrado. Tente outro.');
        } else {
            const senhaCriptografada = await bcrypt.hash(req.body.senha, 10);

            await gratis.insertOne({
                email: req.body.email,
                senha: senhaCriptografada,
                nome: req.body.nome
            });
            res.redirect('/aulasGratis');
        }
    }catch(err){
        res.send('Erro ao registrar cliente gratis.');
    }finally{
        client.close();
    };
});

app.get('/aulasGratis', (req, res) => {
    res.sendFile(__dirname + '/aulasGratis.html')
});

//exibir
app.get('/exibirGratis', (req, res) => {
    res.sendFile(__dirname + '/exibirGratis.html')
})
app.get('/apiexibirGratis', async (req, res) => {
    const client = new MongoClient(url)

    try{
        await client.connect();
        const db = client.db(dbName);
        const gratis = db.collection(gratisCollection);

        const cadastroGratis = await gratis.find({}, {projection: { _id: 1, nome: 1, email: 1, senha: 1}}).toArray();

        res.json(cadastroGratis)
    }catch (err){
        console.error('Erro ao buscar cadastro:', err);
        res.status(500).send('Erro ao buscar cadastro. Tente novamente mais tarde.');
    }finally{
        client.close();
    };
});

//atualizarGratis
app.get('/atualizarGratis', (req, res) => {
    res.sendFile(__dirname + '/atualizarGratis.html')
});

app.post('/atualizarGratis', async (req, res) => {
    const { id, nome, email, senha} = req.body;

    const client = new MongoClient(url);

    try{
        await client.connect();

        const db = client.db(dbName)
        const gratis = db.collection(gratisCollection)

        const result = await gratis.updateOne(
            {_id: new ObjectId(id) },
            {
                $set: {id, nome, email, senha}
            }
        );
        if(result.modifiedCount > 0){
            console.log(`Cliente Gratis com ID: ${id} atualizado com sucesso!`)
            res.redirect('/exibirGratis');
        }else{
            res.status(404).send('Cliente Gratis não encontrado.');
        }
    }catch (err){
        console.error('Erro ao tentar atualizar o cliente:', err);
        res.status(500).send('Erro ao atualizar cliente. Tente novamente mais tarde.')
    }finally{
        client.close();
    };
});

app.get('/clienteGratis/:id', async (req, res) => {
    const { id } = req.params;
    
    const client = new MongoClient(url);

    try{
        await client.connect();
        const db = client.db(dbName)
        const gratis = db.collection(gratisCollection);

        const clienteGratis = await gratis.findOne({_id: new ObjectId(id)});

        if(!clienteGratis){
            return res.status(404).send('Cliente não encontrado.')
        }
        res.json(clienteGratis);
    } catch(err){
        console.error('Erro ao buscar o cliente: ', err);
        res.status(500).send('Erro ao buscar o cliente. Tente novamente mais tarde.');
    }finally{
        client.close();
    }
});

//excluirGratis
app.post('/deletarGratis', async (req, res) => {
    const { id } = req.body;

    const client = new MongoClient(url);

    try{
        await client.connect();
        const db = client.db(dbName)
        const gratis = db.collection(gratisCollection);
        
        const result = await gratis.deleteOne({_id: new ObjectId(id)});

        if(result.deletedCount > 0){
            console.log(`Cliente com ID: ${id} deletado com sucesso.`);
            res.redirect('/exibirGratis')
        }else{
            res.status(404).send('Cliente não encontrado.')
        }
    }catch(err){
        console.error('Erro ao deletar o cliente: ', err);
        res.status(500).send('Erro ao deletar cliente. Tente novamente mais tarde.')
    }finally{
        client.close();
    }
});

//buscar
app.get('/buscarGratis', async (req, res) => {
    const nome  = req.query.nome;
    
    const client = new MongoClient(url);

    try{
        await client.connect();
        const db = client.db(dbName)
        const gratis = db.collection(gratisCollection);

        const clienteGratisBuscado = await gratis.findOne({nome: nome});

        if(!clienteGratisBuscado){
            return res.status(404).send('Cliente não encontrado.')
        }

        const pageHtmlPath  = path.join(__dirname, '/saidaGratis.html');
        let pageHtml = fs.readFileSync(pageHtmlPath, 'utf-8');
        const saidaHtml = criarCardGratis(clienteGratisBuscado);
        pageHtml = pageHtml.replace('{{saidaGratis}}', saidaHtml);
        res.send(pageHtml);
    
    }catch(err){
        console.error('Erro ao buscar o cliente: ', err);
        res.status(500).send('Erro ao buscar o cliente. Tente novamente mais tarde.');
    }finally{
        client.close();
    }
});

function criarCardGratis(gratis){
    return `
    <div class="card mb-3 mx-5" style="margin-top: 80px;">
    <div class="card-header">
    <h5 class="card-title">Nome: ${gratis.nome}</h5>
    </div>
        <div class="card-body">
            <p class="card-text">Email: ${gratis.email}</p>
        </div>
    </div>`
};

//aulaGratis
app.get('/cadastroAulaGratis', (req, res) => {
    res.sendFile(__dirname + '/cadastroAulaGratis.html')
});

app.post('/cadastroAulaGratis', uploadGratis.single('aulaGratis'), async (req, res) => {
    const client = new MongoClient(url);

    try{
        await client.connect();

        const db = client.db(dbName);
        const gratis = db.collection(aulasGratisCollection);


        const video = {
            videoTitle: req.body.videoTitle,
            filePath: req.file.path
        };

        const result = await gratis.insertOne(video);
        console.log(`Aula Gratis cadastrada com sucesso!. ID: ${result.insertedId}`);

        res.redirect('/aulasGratis');
    }catch(err){
        console.error('Erro ao cadastrar Aula Gratis', err);
        res.status(500).send('Erro ao cadastrar Aula Gratis. Tente novamente mais tarde.');
    }finally{
        client.close();
    };
});

//cadastroPlus
app.post('/cadastroPlus', async (req, res) => {
    const client = new MongoClient(url, {useUnifiedTopology: true});
    try{
        await client.connect();
        const db = client.db(dbName);
        const plus = db.collection(plusCollection);

        const clientePlusExistente = await plus.findOne({email: req.body.email});

        if(clientePlusExistente){
            res.send('Esse e-mail já está registrado. Tente outro.');
        } else {
            const senhaCriptografada = await bcrypt.hash(req.body.senha, 10);

            await plus.insertOne({
                email: req.body.email,
                senha: senhaCriptografada,
                nome: req.body.nome
            });
            res.redirect('/aulasPlus');
        }
    }catch(err){
        res.send('Erro ao registrar cliente gratis.');
    }finally{
        client.close();
    };
});

app.post('/loginPlus', async (req, res) => {
    const client = new MongoClient(url, {useUnifiedTopology: true});
    try{
        await client.connect();
        const db = client.db(dbName);
        const users = db.collection(plusCollection);

        const email = await users.findOne({email: req.body.email});

        if(email && await bcrypt.compare(req.body.senha, email.senha)){
            req.session.email = req.body.email;
            res.redirect('/aulasPlus');
        } else {
            res.redirect('/erroPlus');
        }
    } catch(err){
        res.send('Erro ao realizar login.');
    }finally{
        client.close();
    };
});

app.get('/aulasPlus', (req, res) => {
    res.sendFile(__dirname + '/AulasPlus.html')
});

//exibir
app.get('/exibirPlus', (req, res) => {
    res.sendFile(__dirname + '/exibirPlus.html')
})
app.get('/apiexibirPlus', async (req, res) => {
    const client = new MongoClient(url)

    try{
        await client.connect();
        const db = client.db(dbName);
        const plus = db.collection(plusCollection);

        const cadastroPlus = await plus.find({}, {projection: { _id: 1, nome: 1, email: 1, senha: 1}}).toArray();

        res.json(cadastroPlus)
    }catch (err){
        console.error('Erro ao buscar cadastro:', err);
        res.status(500).send('Erro ao buscar cadastro. Tente novamente mais tarde.');
    }finally{
        client.close();
    };
});

//atualizarCadastroPlus
app.get('/atualizarPlus', (req, res) => {
    res.sendFile(__dirname + '/atualizarPlus.html')
});

app.post('/atualizarPlus', async (req, res) => {
    const { id, nome, email, senha} = req.body;

    const client = new MongoClient(url);

    try{
        await client.connect();

        const db = client.db(dbName)
        const plus = db.collection(plusCollection)

        const result = await plus.updateOne(
            {_id: new ObjectId(id) },
            {
                $set: {id, nome, email, senha}
            }
        );
        if(result.modifiedCount > 0){
            console.log(`Cliente Plus com ID: ${id} atualizado com sucesso!`)
            res.redirect('/exibirPlus');
        }else{
            res.status(404).send('Cliente Plus não encontrado.');
        }
    }catch (err){
        console.error('Erro ao tentar atualizar o cliente:', err);
        res.status(500).send('Erro ao atualizar cliente. Tente novamente mais tarde.')
    }finally{
        client.close();
    };
});

app.get('/clienteplus/:id', async (req, res) => {
    const { id } = req.params;
    
    const client = new MongoClient(url);

    try{
        await client.connect();
        const db = client.db(dbName)
        const plus = db.collection(plusCollection);

        const clienteplus = await plus.findOne({_id: new ObjectId(id)});

        if(!clienteplus){
            return res.status(404).send('Cliente não encontrado.')
        }
        res.json(clienteplus);
    } catch(err){
        console.error('Erro ao buscar o cliente: ', err);
        res.status(500).send('Erro ao buscar o cliente. Tente novamente mais tarde.');
    }finally{
        client.close();
    }
});

//excluirCadastroPlus
app.post('/deletarPlus', async (req, res) => {
    const { id } = req.body;

    const client = new MongoClient(url);

    try{
        await client.connect();
        const db = client.db(dbName)
        const plus = db.collection(plusCollection);
        
        const result = await plus.deleteOne({_id: new ObjectId(id)});

        if(result.deletedCount > 0){
            console.log(`Cliente com ID: ${id} deletado com sucesso.`);
            res.redirect('/exibirPlus')
        }else{
            res.status(404).send('Cliente não encontrado.')
        }
    }catch(err){
        console.error('Erro ao deletar o cliente: ', err);
        res.status(500).send('Erro ao deletar cliente. Tente novamente mais tarde.')
    }finally{
        client.close();
    }
});

//buscar
app.get('/buscarPlus', async (req, res) => {
    const nome  = req.query.nome;
    
    const client = new MongoClient(url);

    try{
        await client.connect();
        const db = client.db(dbName)
        const plus = db.collection(plusCollection);

        const clientePlusBuscado = await plus.findOne({nome: nome});

        if(!clientePlusBuscado){
            return res.status(404).send('Cliente não encontrado.')
        }

        const pageHtmlPath  = path.join(__dirname, '/saidaPlus.html');
        let pageHtml = fs.readFileSync(pageHtmlPath, 'utf-8');
        const saidaHtml = criarCardPlus(clientePlusBuscado);
        pageHtml = pageHtml.replace('{{saidaPlus}}', saidaHtml);
        res.send(pageHtml);
    
    }catch(err){
        console.error('Erro ao buscar o cliente: ', err);
        res.status(500).send('Erro ao buscar o cliente. Tente novamente mais tarde.');
    }finally{
        client.close();
    }
});

function criarCardPlus(plus){
    return `
    <div class="card mb-3 mx-5" style="margin-top: 80px;">
    <div class="card-header">
    <h5 class="card-title">Nome: ${plus.nome}</h5>
    </div>
        <div class="card-body">
            <p class="card-text">Email: ${plus.email}</p>
        </div>
    </div>`
};

//aulaPlus
app.get('/cadastroAulaPlus', (req, res) => {
    res.sendFile(__dirname + '/cadastroAulaPlus.html')
});

app.post('/cadastroAulaPlus', uploadPlus.single('aulaPlus'), async (req, res) => {
    const client = new MongoClient(url);

    try{
        await client.connect();

        const db = client.db(dbName);
        const plus = db.collection(aulasPlusCollection);


        const video = {
            videoTitle: req.body.videoTitle,
            filePath: req.file.path
        };

        const result = await plus.insertOne(video);
        console.log(`Aula Plus cadastrada com sucesso!. ID: ${result.insertedId}`);

        res.redirect('/aulasPlus');
    }catch(err){
        console.error('Erro ao cadastrar Aula Plus', err);
        res.status(500).send('Erro ao cadastrar Aula Plus. Tente novamente mais tarde.');
    }finally{
        client.close();
    };
});

//cadastroPremium
app.post('/cadastroPremium', async (req, res) => {
    const client = new MongoClient(url, {useUnifiedTopology: true});
    try{
        await client.connect();
        const db = client.db(dbName);
        const premium = db.collection(premiumCollection);

        const clientePremiumExistente = await premium.findOne({email: req.body.email});

        if(clientePremiumExistente){
            res.send('Esse e-mail já está registrado. Tente outro.');
        } else {
            const senhaCriptografada = await bcrypt.hash(req.body.senha, 10);

            await premium.insertOne({
                email: req.body.email,
                senha: senhaCriptografada,
                nome: req.body.nome
            });
            res.redirect('/aulasPremium');
        }
    }catch(err){
        res.send('Erro ao registrar cliente gratis.');
    }finally{
        client.close();
    };
});

app.get('/aulasPremium', (req, res) => {
    res.sendFile(__dirname + '/aulasPremium.html')
});

app.post('/loginPremium', async (req, res) => {
    const client = new MongoClient(url, {useUnifiedTopology: true});
    try{
        await client.connect();
        const db = client.db(dbName);
        const users = db.collection(premiumCollection);

        const email = await users.findOne({email: req.body.email});

        if(email && await bcrypt.compare(req.body.senha, email.senha)){
            req.session.email = req.body.email;
            res.redirect('/aulasPremium');
        } else {
            res.redirect('/erroPremium');
        }
    } catch(err){
        res.send('Erro ao realizar login.');
    }finally{
        client.close();
    };
});

//exibir
app.get('/exibirPremium', (req, res) => {
    res.sendFile(__dirname + '/exibirPremium.html')
})
app.get('/apiexibirPremium', async (req, res) => {
    const client = new MongoClient(url)

    try{
        await client.connect();
        const db = client.db(dbName);
        const premium = db.collection(premiumCollection);

        const cadastroPremium = await premium.find({}, {projection: { _id: 1, nome: 1, email: 1, senha: 1}}).toArray();

        res.json(cadastroPremium)
    }catch (err){
        console.error('Erro ao buscar cadastro:', err);
        res.status(500).send('Erro ao buscar cadastro. Tente novamente mais tarde.');
    }finally{
        client.close();
    };
});

//atualizarPremium
app.get('/atualizarPremium', (req, res) => {
    res.sendFile(__dirname + '/atualizarPremium.html')
});

app.post('/atualizarPremium', async (req, res) => {
    const { id, nome, email, senha} = req.body;

    const client = new MongoClient(url);

    try{
        await client.connect();

        const db = client.db(dbName)
        const premium = db.collection(premiumCollection)

        const result = await premium.updateOne(
            {_id: new ObjectId(id) },
            {
                $set: {id, nome, email, senha}
            }
        );
        if(result.modifiedCount > 0){
            console.log(`Cliente Premium com ID: ${id} atualizado com sucesso!`)
            res.redirect('/exibirPremium');
        }else{
            res.status(404).send('Cliente Premium não encontrado.');
        }
    }catch (err){
        console.error('Erro ao tentar atualizar o cliente:', err);
        res.status(500).send('Erro ao atualizar cliente. Tente novamente mais tarde.')
    }finally{
        client.close();
    };
});

app.get('/clientepremium/:id', async (req, res) => {
    const { id } = req.params;
    
    const client = new MongoClient(url);

    try{
        await client.connect();
        const db = client.db(dbName)
        const premium = db.collection(premiumCollection);

        const clientepremium = await premium.findOne({_id: new ObjectId(id)});

        if(!clientepremium){
            return res.status(404).send('Cliente não encontrado.')
        }
        res.json(clientepremium);
    } catch(err){
        console.error('Erro ao buscar o cliente: ', err);
        res.status(500).send('Erro ao buscar o cliente. Tente novamente mais tarde.');
    }finally{
        client.close();
    }
});

//excluirCadastroPremium
app.post('/deletarPremium', async (req, res) => {
    const { id } = req.body;

    const client = new MongoClient(url);

    try{
        await client.connect();
        const db = client.db(dbName)
        const premium = db.collection(premiumCollection);
        
        const result = await premium.deleteOne({_id: new ObjectId(id)});

        if(result.deletedCount > 0){
            console.log(`Cliente com ID: ${id} deletado com sucesso.`);
            res.redirect('/exibirPremium')
        }else{
            res.status(404).send('Cliente não encontrado.')
        }
    }catch(err){
        console.error('Erro ao deletar o cliente: ', err);
        res.status(500).send('Erro ao deletar cliente. Tente novamente mais tarde.')
    }finally{
        client.close();
    }
});

//buscar
app.get('/buscarPremium', async (req, res) => {
    const nome  = req.query.nome;
    
    const client = new MongoClient(url);

    try{
        await client.connect();
        const db = client.db(dbName)
        const premium = db.collection(premiumCollection);

        const clientePremiumBuscado = await premium.findOne({nome: nome});

        if(!clientePremiumBuscado){
            return res.status(404).send('Cliente não encontrado.')
        }

        const pageHtmlPath  = path.join(__dirname, '/saidaPremium.html');
        let pageHtml = fs.readFileSync(pageHtmlPath, 'utf-8');
        const saidaHtml = criarCardPremium(clientePremiumBuscado);
        pageHtml = pageHtml.replace('{{saidaPremium}}', saidaHtml);
        res.send(pageHtml);
    
    }catch(err){
        console.error('Erro ao buscar o cliente: ', err);
        res.status(500).send('Erro ao buscar o cliente. Tente novamente mais tarde.');
    }finally{
        client.close();
    }
});

function criarCardPremium(premium){
    return `
    <div class="card mb-3 mx-5" style="margin-top: 80px;">
    <div class="card-header">
    <h5 class="card-title">Nome: ${premium.nome}</h5>
    </div>
        <div class="card-body">
            <p class="card-text">Email: ${premium.email}</p>
        </div>
    </div>`
};

//aulaPremium
app.get('/cadastroAulaPremium', (req, res) => {
    res.sendFile(__dirname + '/cadastroAulaPremium.html')
});

app.post('/cadastroAulaPremium', uploadPremium.single('aulaPremium'), async (req, res) => {
    const client = new MongoClient(url);

    try{
        await client.connect();

        const db = client.db(dbName);
        const premium = db.collection(aulasPremiumCollection);


        const video = {
            videoTitle: req.body.videoTitle,
            filePath: req.file.path
        };

        const result = await premium.insertOne(video);
        console.log(`Aula Premium cadastrada com sucesso!. ID: ${result.insertedId}`);

        res.redirect('/aulasPremium');
    }catch(err){
        console.error('Erro ao cadastrar Aula Premium', err);
        res.status(500).send('Erro ao cadastrar Aula Premium. Tente novamente mais tarde.');
    }finally{
        client.close();
    };
});


//cadastroGold
app.post('/cadastroGold', async (req, res) => {
    const client = new MongoClient(url, {useUnifiedTopology: true});
    try{
        await client.connect();
        const db = client.db(dbName);
        const gold = db.collection(goldCollection);

        const clienteGoldExistente = await gold.findOne({email: req.body.email});

        if(clienteGoldExistente){
            res.send('Esse e-mail já está registrado. Tente outro.');
        } else {
            const senhaCriptografada = await bcrypt.hash(req.body.senha, 10);

            await gold.insertOne({
                email: req.body.email,
                senha: senhaCriptografada,
                nome: req.body.nome
            });
            res.redirect('/aulasGold');
        }
    }catch(err){
        res.send('Erro ao registrar cliente gratis.');
    }finally{
        client.close();
    };
});

app.get('/aulasGold', (req, res) => {
    res.sendFile(__dirname + '/aulasGold.html')
});

app.post('/loginGold', async (req, res) => {
    const client = new MongoClient(url, {useUnifiedTopology: true});
    try{
        await client.connect();
        const db = client.db(dbName);
        const users = db.collection(goldCollection);

        const email = await users.findOne({email: req.body.email});

        if(email && await bcrypt.compare(req.body.senha, email.senha)){
            req.session.email = req.body.email;
            res.redirect('/aulasGold');
        } else {
            res.redirect('/erroGold');
        }
    } catch(err){
        res.send('Erro ao realizar login.');
    }finally{
        client.close();
    };
});

app.get('/exibirGold', (req, res) => {
    res.sendFile(__dirname + '/exibirGold.html')
})
app.get('/apiexibirGold', async (req, res) => {
    const client = new MongoClient(url)

    try{
        await client.connect();
        const db = client.db(dbName);
        const gold = db.collection(goldCollection);

        const cadastroGold = await gold.find({}, {projection: { _id: 1, nome: 1, email: 1, senha: 1}}).toArray();

        res.json(cadastroGold)
    }catch (err){
        console.error('Erro ao buscar cadastro:', err);
        res.status(500).send('Erro ao buscar cadastro. Tente novamente mais tarde.');
    }finally{
        client.close();
    };
});

//atualizarGold
app.get('/atualizarGold', (req, res) => {
    res.sendFile(__dirname + '/atualizarGold.html')
});

app.post('/atualizarGold', async (req, res) => {
    const { id, nome, email, senha} = req.body;

    const client = new MongoClient(url);

    try{
        await client.connect();

        const db = client.db(dbName)
        const gold = db.collection(goldCollection)

        const result = await gold.updateOne(
            {_id: new ObjectId(id) },
            {
                $set: {id, nome, email, senha}
            }
        );
        if(result.modifiedCount > 0){
            console.log(`Cliente Gold com ID: ${id} atualizado com sucesso!`)
            res.redirect('/exibirGold');
        }else{
            res.status(404).send('Cliente Gold não encontrado.');
        }
    }catch (err){
        console.error('Erro ao tentar atualizar o cliente:', err);
        res.status(500).send('Erro ao atualizar cliente. Tente novamente mais tarde.')
    }finally{
        client.close();
    };
});

app.get('/clientegold/:id', async (req, res) => {
    const { id } = req.params;
    
    const client = new MongoClient(url);

    try{
        await client.connect();
        const db = client.db(dbName)
        const gold = db.collection(goldCollection);

        const clientegold = await gold.findOne({_id: new ObjectId(id)});

        if(!clientegold){
            return res.status(404).send('Cliente não encontrado.')
        }
        res.json(clientegold);
    } catch(err){
        console.error('Erro ao buscar o cliente: ', err);
        res.status(500).send('Erro ao buscar o cliente. Tente novamente mais tarde.');
    }finally{
        client.close();
    }
});

//excluirCadastroGold
app.post('/deletarGold', async (req, res) => {
    const { id } = req.body;

    const client = new MongoClient(url);

    try{
        await client.connect();
        const db = client.db(dbName)
        const gold = db.collection(goldCollection);
        
        const result = await gold.deleteOne({_id: new ObjectId(id)});

        if(result.deletedCount > 0){
            console.log(`Cliente com ID: ${id} deletado com sucesso.`);
            res.redirect('/exibirGold')
        }else{
            res.status(404).send('Cliente não encontrado.')
        }
    }catch(err){
        console.error('Erro ao deletar o cliente: ', err);
        res.status(500).send('Erro ao deletar cliente. Tente novamente mais tarde.')
    }finally{
        client.close();
    }
});

//buscar
app.get('/buscarGold', async (req, res) => {
    const nome  = req.query.nome;
    
    const client = new MongoClient(url);

    try{
        await client.connect();
        const db = client.db(dbName)
        const gold = db.collection(goldCollection);

        const clienteGoldBuscado = await gold.findOne({nome: nome});

        if(!clienteGoldBuscado){
            return res.status(404).send('Cliente não encontrado.')
        }

        const pageHtmlPath  = path.join(__dirname, '/saidaGold.html');
        let pageHtml = fs.readFileSync(pageHtmlPath, 'utf-8');
        const saidaHtml = criarCardGold(clienteGoldBuscado);
        pageHtml = pageHtml.replace('{{saidaGold}}', saidaHtml);
        res.send(pageHtml);
    
    }catch(err){
        console.error('Erro ao buscar o cliente: ', err);
        res.status(500).send('Erro ao buscar o cliente. Tente novamente mais tarde.');
    }finally{
        client.close();
    }
});

function criarCardGold(gold){
    return `
    <div class="card mb-3 mx-5" style="margin-top: 80px;">
    <div class="card-header">
    <h5 class="card-title">Nome: ${gold.nome}</h5>
    </div>
        <div class="card-body">
            <p class="card-text">Email: ${gold.email}</p>
        </div>
    </div>`
};

//cadastroAulaGold
app.get('/cadastroAulaGold', (req, res) => {
    res.sendFile(__dirname + '/cadastroAulaGold.html')
});

app.post('/cadastroAulaGold', uploadGold.single('aulaGold'), async (req, res) => {
    const client = new MongoClient(url);

    try{
        await client.connect();

        const db = client.db(dbName);
        const gold = db.collection(aulasGoldCollection);


        const video = {
            videoTitle: req.body.videoTitle,
            filePath: req.file.path
        };

        const result = await gold.insertOne(video);
        console.log(`Aula Gold cadastrada com sucesso!. ID: ${result.insertedId}`);

        res.redirect('/aulasGold');
    }catch(err){
        console.error('Erro ao cadastrar Aula Gold', err);
        res.status(500).send('Erro ao cadastrar Aula Gold. Tente novamente mais tarde.');
    }finally{
        client.close();
    };
});


app.listen(port, () => { 
    console.log(`Servidor rodando em http://localhost:${port}`);
});


//  "type": "module"
