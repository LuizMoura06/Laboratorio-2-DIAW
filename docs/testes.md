# Plano de testes e demonstração

## Testes de construção

| Verificação | Comando | Resultado esperado |
| --- | --- | --- |
| Front-end TypeScript | `npm run build` em `frontend` | Compilação sem erros e pasta `dist` |
| Back-end Maven | `mvn test` em `backend` | Testes e classes compilados com JDK 25 |
| Inicialização SQL | `mvn spring-boot:run` com variáveis do Supabase | Tabelas criadas e seis veículos cadastrados |
| Saúde da API | GET `/api/health` | `{"status":"ok","service":"AlugaMais API"}` |
| Integração HTTP | GitHub Actions, PostgreSQL 16 temporário | Cadastro, login, listagem da frota, pedido, aprovação e contrato |

Os 10 testes unitários estão em `backend/src/test/java`. Eles verificam validação de cadastro, formato de hash, login, papéis de usuário, datas dos pedidos, estados da análise e pré-requisito para contratos. O GitHub Actions também inicia o Spring Boot conectado a um PostgreSQL temporário, executa requisições HTTP e verifica o fluxo principal do pedido até a emissão do contrato. As verificações específicas do projeto Supabase e os demais cenários de interface continuam no roteiro manual.

## Testes funcionais manuais

- [x] Cadastro de cliente com CPF, RG, nome, endereço e profissão (integração HTTP).
- [ ] Tentativa de cadastro com usuário ou CPF repetido bloqueada.
- [ ] Login incorreto retorna erro; login correto entra no painel (login correto verificado na API).
- [ ] Acesso sem token a `/api/vehicles` é negado.
- [ ] Cliente consegue consultar, alterar e, se não tiver pedidos, excluir o cadastro.
- [ ] Cliente registra até três empregadores; o quarto é bloqueado.
- [ ] Cliente visualiza matrícula, placa, marca, modelo e propriedade dos veículos.
- [x] Cliente cria pedido e o status começa como Pendente (integração HTTP).
- [ ] Pedido com devolução anterior à retirada é recusado.
- [ ] Mesmo veículo não pode receber períodos ativos sobrepostos.
- [ ] Cliente edita pedido pendente e pode cancelá-lo.
- [ ] Cliente não consegue consultar pedido de outro cliente.
- [ ] Agente visualiza pedidos, consulta cliente e registra parecer financeiro.
- [ ] Agente aprova ou rejeita pedido e a decisão permanece no banco (aprovação verificada na integração HTTP).
- [ ] Contrato só pode ser criado após aprovação (emissão após aprovação verificada na integração HTTP).
- [ ] Contrato pode possuir crédito com banco agente cadastrado.
- [x] Cliente consulta contratos relacionados à própria conta (integração HTTP).
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

As caixas marcadas identificam cenários cobertos pelo teste de integração automático com PostgreSQL. As demais dependem de verificação manual completa com o front-end e o projeto Supabase. O funcionamento da interface isolada não comprova a integração com o banco.

