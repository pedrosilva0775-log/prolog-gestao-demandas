import { describe,expect,it } from 'vitest';
import { recordHttpMetric,renderMetrics } from './metrics.js';
describe('métricas Prometheus',()=>{it('expõe contadores sem PII',()=>{recordHttpMetric('GET',200,12);const output=renderMetrics();expect(output).toContain('prolog_http_requests_total{method="GET",status="200"}');expect(output).not.toContain('email');});});
