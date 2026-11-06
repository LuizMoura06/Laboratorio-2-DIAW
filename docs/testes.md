# Plano de testes e demonstração

## Testes de construção

| Verificação | Comando | Resultado esperado |
| --- | --- | --- |
| Front-end TypeScript | `npm run build` em `frontend` | Compilação sem erros e pasta `dist` |
| Back-end Maven | `mvn test` em `backend` | Testes e classes compilados com JDK 25 |
| Inicialização SQL | `mvn spring-boot:run` com variáveis do Supabase | Tabelas criadas e seis veículos cadastrados |
| Saúde da API | GET `/api/health` | `{"status":"ok","service":"AlugaMais API"}` |

Os 10 testes unitários estão em `backend/src/test/java`. Eles verificam validação de cadastro, formato de hash, login, papéis de usuário, datas dos pedidos, estados da análise e pré-requisito para contratos. O fluxo completo com PostgreSQL permanece como teste manual, pois depende de um projeto Supabase configurado.

## Testes funcionais manuais

- [ ] Cadastro de cliente com CPF, RG, nome, endereço e profissão.
- [ ] Tentativa de cadastro com usuário ou CPF repetido bloqueada.
- [ ] Login incorreto retorna erro; login correto entra no painel.
- [ ] Acesso sem token a `/api/vehicles` é negado.
- [ ] Cliente consegue consultar, alterar e, se não tiver pedidos, excluir o cadastro.
- [ ] Cliente registra até três empregadores; o quarto é bloqueado.
- [ ] Cliente visualiza matrícula, placa, marca, modelo e propriedade dos veículos.
- [ ] Cliente cria pedido e o status começa como Pendente.
- [ ] Pedido com devolução anterior à retirada é recusado.
- [ ] Mesmo veículo não pode receber períodos ativos sobrepostos.
- [ ] Cliente edita pedido pendente e pode cancelá-lo.
- [ ] Cliente não consegue consultar pedido de outro cliente.
- [ ] Agente visualiza pedidos, consulta cliente e registra parecer financeiro.
- [ ] Agente aprova ou rejeita pedido e a decisão permanece no banco.
- [ ] Contrato só pode ser criado após aprovação.
- [ ] Contrato pode possuir crédito com banco agente cadastrado.
- [ ] Cliente consulta contratos relacionados à própria conta.
- [ ] Interface funciona em desktop, tablet e celular sem rolagem lateral.

## Roteiro para a apresentação

1. Explicar a proposta e a stack: React, Spring Boot MVC, Maven, Supabase.
2. Mostrar o diagrama de casos de uso e as histórias do usuário.
3. Comparar os diagramas de classes e pacotes v1 e v2.
4. Cadastrar um cliente e inserir empregadores.
5. Criar um pedido e consultar seu status.
6. Entrar com um agente, avaliar o pedido e gerar contrato.
7. Mostrar que o banco persiste os registros após atualizar a página.
8. Apresentar a organização do repositório e as instruções do README.

## Observação

As caixas de testes manuais devem ser marcadas somente depois da execução real com o back-end conectado a um projeto Supabase. O funcionamento da interface isolada não comprova a integração com o banco.

