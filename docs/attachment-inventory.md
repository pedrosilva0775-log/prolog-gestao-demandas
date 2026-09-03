# Inventário de anexos

Execute informando explicitamente o banco, a raiz e um arquivo novo para o relatório:

`DATABASE_URL=postgresql://... npm run attachments:inventory -- /caminho/uploads ./attachment-report.json`

A ferramenta é somente leitura para banco e uploads. Ela não remove, move ou corrige arquivos. `missing_file` indica metadado sem arquivo; `orphan_file`, arquivo sem metadado fora da janela de cinco minutos; `ambiguous_reference`, legado com mais de um proprietário; `cleanup_required`, falha registrada ao remover um arquivo cuja persistência não foi concluída; `invalid_path`, chave inválida; `escaping_symlink`, link que sai da raiz; `size_mismatch`, tamanho divergente; e `read_error`, falha de permissão ou leitura.

Investigue manualmente comparando a demanda, o comentário, os logs e o backup. Não restaure acesso nem exclua arquivos automaticamente. Repita o inventário após resolver a causa e preserve ambos os relatórios como evidência operacional.
