import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import dayjs from 'dayjs';

dotenv.config();

const server = express();

server.use(cors());
server.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI)

let db;

mongoClient.connect().then(() => {
    db = mongoClient.db('batepapo_uol');
});

server.post('/participants', async (req, res) => {
    const { name } = req.body;

    if (!name) {
        res.sendStatus(422);
        return;
    }

    const hasName = await db.collection('participants').find({ name }).toArray();

    if (hasName.length > 0) {
        res.status(409).send({ message:'Nome já existente!' });
        return;
    }

  
    db.collection('participants').insertOne({ name, lastStatus: Date.now() });
    db.collection('messages').insertOne({
        from: name,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: dayjs(new Date()).format('HH:mm:ss')
    })

    res.status(201).send({ message:'Usuário criado' });
});

server.get('/participants', async (req, res) => {
    let participants = await db.collection('participants').find().toArray();

    participants = participants.map(({ name, lastStatus }) => ({ name, lastStatus }));

    res.send(participants);
});

server.post('/messages', async (req, res) => {
    const { user } = req.headers;
    const { to, text, type } = req.body;

    const hasUser = await db.collection('participants').find({ name:user }).toArray();

    if (!to || !text) {
        res.status(422).send({ message:'Campos vazios são inválidos!' });
        return;
    }

    if ((type !== 'message') && (type !== 'private_message')) {
        res.status(422).send({ message:'Tipo de mensagem inválido!' });
        return;
    }

    if (hasUser.length === 0) {
        res.status(422).send({ message:'Remetente inválido!' });
        return;
    }

    db.collection('messages').insertOne({
        from: user,
        to,
        text,
        type,
        time: dayjs(new Date()).format('HH:mm:ss')
    });

    res.status(201).send({ message:'Mensagem enviada' });
});

server.listen(5000, () => console.log('Servidor rodando na porta 5000.'));