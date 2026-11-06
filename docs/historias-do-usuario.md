# Histórias do usuário — AlugaMais

As histórias descrevem as necessidades dos dois tipos de usuário especificados para o sistema.

| ID | Perfil | História | Critérios de aceitação |
| --- | --- | --- | --- |
| HU01 | Cliente | Como cliente, quero me cadastrar para utilizar o sistema. | Cadastro com usuário, senha, CPF, RG, nome, endereço e profissão; CPF e usuário únicos. |
| HU02 | Agente | Como agente de empresa ou banco, quero criar minha conta para avaliar aluguéis. | Tipo do agente e CNPJ registrados; perfil AGENT. |
| HU03 | Ambos | Como usuário, quero fazer login para proteger meus dados. | Senha validada; token temporário; endpoints exigem autenticação. |
| HU04 | Cliente | Como cliente, quero consultar e alterar meus dados cadastrais. | Perfil consultável e editável; exclusão permitida se não houver histórico de pedidos. |
| HU05 | Cliente | Como cliente, quero registrar meus empregadores e rendimentos. | No máximo três vínculos; criação, edição e exclusão disponíveis. |
| HU06 | Cliente | Como cliente, quero visualizar os automóveis disponíveis. | Matrícula, ano, marca, modelo, placa, preço e proprietário apresentados. |
| HU07 | Cliente | Como cliente, quero criar um pedido de aluguel. | Veículo, datas e observações; datas válidas; solicitação armazenada como PENDING. |
| HU08 | Cliente | Como cliente, quero acompanhar o status de cada pedido. | Lista individual com status, datas, valor estimado e parecer. |
| HU09 | Cliente | Como cliente, quero modificar ou cancelar solicitações. | Edição quando PENDING; cancelamento antes do contrato; acesso somente a pedidos próprios. |
| HU10 | Agente | Como agente, quero consultar clientes e solicitações para avaliar pedidos. | Listas disponíveis apenas a AGENT; consulta de dados financeiros declarados. |
| HU11 | Agente | Como agente, quero registrar parecer financeiro positivo ou negativo. | Status UNDER_REVIEW, APPROVED ou REJECTED; justificativa e agente responsável persistidos. |
| HU12 | Agente | Como agente, quero formalizar contratos para pedidos aprovados. | Contrato só é criado para pedido APPROVED e altera o pedido para CONTRACTED. |
| HU13 | Banco/Agente | Como agente, quero associar crédito bancário ao aluguel quando aplicável. | Banco concedente deve ser um agente do tipo BANK; valor e parcelas registrados. |
| HU14 | Ambos | Como usuário, quero consultar os contratos associados aos meus pedidos. | Cliente acessa somente contratos próprios; agente acessa contratos do sistema. |

## Regras de negócio

- RN01: o sistema só pode ser utilizado após cadastro e login.
- RN02: cliente e agente possuem permissões diferentes, verificadas também no back-end.
- RN03: cada cliente pode registrar até três entidades empregadoras com rendimentos não negativos.
- RN04: cada veículo possui matrícula e placa únicas, além de proprietário registrado como cliente, empresa ou banco.
- RN05: o período do aluguel precisa ser futuro ou iniciado no dia atual e a devolução deve ocorrer após a retirada.
- RN06: não são aceitos pedidos com conflito de datas para o mesmo veículo enquanto houver pedido ativo.
- RN07: somente agentes podem emitir parecer financeiro, com justificativa registrada.
- RN08: contratos só podem ser emitidos após parecer positivo.
- RN09: contrato de crédito é opcional, mas, se existir, exige um banco agente cadastrado.
- RN10: dados de autenticação não são enviados ao cliente, exceto o token de sessão da própria conta.

## Cenários para demonstração

1. Cadastrar um cliente e entrar no sistema.
2. Consultar a frota e criar um pedido de aluguel.
3. Visualizar o pedido como Pendente, editar as datas e adicionar um empregador.
4. Cadastrar um agente de empresa e fazer login.
5. Consultar o cliente, analisar e aprovar o pedido.
6. Formalizar o contrato; opcionalmente, cadastrar um banco e adicionar crédito.
7. Entrar novamente como cliente e verificar o status Contratado.

