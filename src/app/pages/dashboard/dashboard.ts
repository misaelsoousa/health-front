import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type MetricCard = {
  label: string;
  value: string;
  detail: string;
  accent: 'blue' | 'green' | 'slate';
};

type StatusItem = {
  label: string;
  value: number;
  color: string;
};

type ModalityItem = {
  label: string;
  value: number;
  color: string;
};

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  readonly metrics: MetricCard[] = [
    { label: 'Pacientes cadastrados', value: '248', detail: '+18 desde a semana passada', accent: 'blue' },
    { label: 'Pacientes ativos', value: '203', detail: '81,9% da base em acompanhamento', accent: 'green' },
    { label: 'Pacientes inativos', value: '45', detail: '18,1% sem registro recente', accent: 'slate' },
    { label: 'Exames no mês', value: '612', detail: '+14,2% em relação ao mês anterior', accent: 'blue' },
  ];

  readonly statusDistribution: StatusItem[] = [
    { label: 'Ativos', value: 203, color: '#3FB287' },
    { label: 'Inativos', value: 45, color: '#2B3674' },
  ];

  readonly modalityMix: ModalityItem[] = [
    { label: 'CT', value: 86, color: '#2B3674' },
    { label: 'MR', value: 72, color: '#3FB287' },
    { label: 'US', value: 58, color: '#1F264E' },
    { label: 'DX', value: 41, color: '#74FECA' },
    { label: 'MG', value: 36, color: '#7C8DB5' },
  ];

  readonly totalStatus = this.statusDistribution.reduce((sum, item) => sum + item.value, 0);
  readonly totalModality = this.modalityMix.reduce((sum, item) => sum + item.value, 0);
  readonly modalityMax = Math.max(...this.modalityMix.map((item) => item.value));
  readonly donutCircumference = 2 * Math.PI * 54;
  readonly donutSegments = this.statusDistribution.map((item, index) => ({
    ...item,
    dashOffset: this.getDonutOffset(index),
  }));

  barWidth(value: number) {
    return Math.max(8, (value / this.modalityMax) * 100);
  }

  statusPercent(value: number) {
    return Math.round((value / this.totalStatus) * 100);
  }

  private getDonutOffset(index: number) {
    const previousValues = this.statusDistribution.slice(0, index).reduce((sum, item) => sum + item.value, 0);
    return this.donutCircumference * (previousValues / this.totalStatus);
  }
}
