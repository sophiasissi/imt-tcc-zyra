# 👗 ZYRA — Assistente de Vestuário Inteligente para Daltônicos

O **ZYRA** é um aplicativo mobile desenvolvido como Trabalho de Conclusão de Curso (TCC), com o objetivo de auxiliar pessoas com daltonismo na escolha e combinação de roupas de forma autônoma, utilizando inteligência artificial, visão computacional e design inclusivo.

---

## 🎯 Objetivo

O projeto busca reduzir a dependência de terceiros na escolha de vestimentas, promovendo:

- Autonomia
- Inclusão
- Confiança
- Expressão pessoal

---

## 💡 Problema

Pessoas com daltonismo enfrentam dificuldades como:

- Identificar cores corretamente
- Combinar roupas com segurança
- Dependência de terceiros
- Insegurança na tomada de decisão

O ZYRA surge como uma solução tecnológica para esse problema.

---

## 🚀 Funcionalidades principais

- 📸 **Identificação de cores em tempo real** (via câmera)
- 👕 **Closet virtual inteligente**
- 🎨 **Integração com sistema ColorADD**
- 🤖 **Sugestão automática de looks**
- 💬 **Chat com IA para interação natural**
- 🛍️ **Auxílio na compra de roupas**
- 🎯 **Personalização por paleta acessível**
- ♿ **Interface inclusiva e acessível**

---

## 🧠 Tecnologias utilizadas

### 📱 Front-end

- React Native
- Expo
- TypeScript

### ⚙️ Back-end

- Node.js
- NestJS

### ☁️ Infraestrutura

- AWS (RDS, S3, Cognito)

### 🤖 Inteligência Artificial

- OpenAI API

### 👁️ Visão Computacional

- Python
- OpenCV

---

## 🧩 Arquitetura

O projeto segue uma arquitetura modular:

```txt
Mobile App (React Native)
        ↓
Backend API (NestJS)
        ↓
 ├── AWS Cognito (Autenticação)
 ├── AWS S3 (Armazenamento de imagens)
 ├── Banco de dados (AWS RDS)
 ├── OpenAI API (IA)
 └── Serviço de visão computacional (Python/OpenCV)
```
