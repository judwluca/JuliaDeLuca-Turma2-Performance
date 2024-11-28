import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Métricas
export let getDurationTrend = new Trend('get_duration');
export let statusCode200Rate = new Rate('status_code_200');

// Configurando as opções de teste
export const options = {
  thresholds: {
    get_duration: ['p(95)<5700'],
    http_req_failed: ['rate<0.12'],
    status_code_200: ['rate>0.95']
  },
  stages: [
    { duration: '60s', target: 10 },
    { duration: '60s', target: 70 },
    { duration: '60s', target: 150 },
    { duration: '60s', target: 200 },
    { duration: '60s', target: 300 }
  ]
};

// Função para gerar o resumo dos resultados
export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

// Função principal de teste
export default function () {
  const baseUrl = 'https://dog.ceo/api/breeds/list/all';

  const params = {
    timeout: '60s',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const OK = 200;

  const res = http.get(`${baseUrl}`, params);

  // Adicionando a duração da requisição à métrica Trend
  getDurationTrend.add(res.timings.duration);

  // Verificando se o status code é 200 e adicionando à métrica Rate
  statusCode200Rate.add(res.status === OK);

  // Validação do status code 200
  check(res, {
    'GET Breeds - Status 200': () => res.status === OK
  });
}
