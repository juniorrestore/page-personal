import useSWR from 'swr';

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}
export default function StatusPage() {
  return (
    <div align="center">
      <h1>Health Check</h1>
      <h3>Status</h3>
      <UpdateAt />
      <h3> Dados do Banco</h3>
      <BaseData />
    </div>
  );
}

function UpdateAt() {
  const { data, isLoading } = useSWR('/api/v1/status', fetchAPI);
  let updateAtText = 'Carregando ...';
  if (!isLoading) {
    updateAtText = new Date(data.update_at).toLocaleString('pt-BR');
  }
  return <div>Última atualização: {updateAtText}</div>;
}

function BaseData() {
  setTimeout(() => {}, 10000);
  const { data, isLoading } = useSWR('/api/v1/status', fetchAPI);
  let baseVersion = '';
  let activeUsers = '';
  let maxConnections = '';
  if (data) {
    baseVersion =
      data.database?.version ||
      'Versão disponível somente para administradores';
    activeUsers = data.database?.active_users || 'Não disponível';
    maxConnections = data.database?.max_connections || 'Não disponível';
  }

  return (
    <>
      {isLoading ? (
        <p>Carregando dados do banco...</p>
      ) : (
        <div>
          <p>Versão: {baseVersion}</p>
          <p>Usuários ativos: {activeUsers}</p>
          <p>Máximo de conexões: {maxConnections}</p>
        </div>
      )}
    </>
  );
}
