import { Component, OnInit, ViewChild, Input, OnDestroy } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';

import { Observable } from 'rxjs';

import { PacketSelectComponent } from '../packet-select/packet-select.component';
import { ActivatedRoute } from "@angular/router";
import { Rule, RulesService } from 'core';
import { Threshold } from '../../../base/base-widget/model/widget.model';

@Component({
    selector: 'hyperiot-time-chart-settings',
    templateUrl: './time-chart-settings.component.html',
    styleUrls: ['./time-chart-settings.component.scss'],
    viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class TimeChartSettingsComponent implements OnInit, OnDestroy {
    @ViewChild(PacketSelectComponent, { static: true }) packetSelect: PacketSelectComponent;
    subscription: any;
    @Input() modalApply: Observable<any>;
    @Input() widget;
    @Input() areaId;
    @Input() hDeviceId;
    @Input() checkbox: boolean;
    selectedFields = [];
    selectedPackets = [];

    thresholds: any = [];
    thresholdsIds: string[] = [];
    thresholdActive: boolean = false;
    selectedThresholds: Threshold[] = [];
    newThreshold: any = {};

    private defaultConfig = {
        timeAxisRange: 10,
        //no limits in data points
        maxDataPoints: 0,
        timeWindow: 60,
        refreshIntervalMillis: 100,
        layout: {
            showlegend: true,
            legend: {
                orientation: 'h',
                x: 0.25,
                y: 1,
                traceorder: 'normal',
                font: {
                    family: 'sans-serif',
                    size: 10,
                    color: '#000'
                },
                bgcolor: '#FFFFFF85',
                borderwidth: 0
            }
        }
    };

    constructor(public settingsForm: NgForm, private activatedRoute: ActivatedRoute, private ruleService: RulesService) { }

    ngOnInit() {
        if (this.widget.config == null) {
            this.widget.config = {};
        }

        if (this.widget.config.seriesConfig == null || this.widget.config.seriesConfig.length === 0) {
            Object.assign(this.widget.config, this.defaultConfig);
        }
        if (this.widget.config.threshold) {
            this.thresholdActive = this.widget.config.threshold.thresholdActive;
            this.selectedThresholds = this.widget.config.threshold.thresholds ? this.widget.config.threshold.thresholds : [];
            this.isChecked();
        } else {
            this.widget.config.threshold = {
                thresholdActive: this.thresholdActive
            }
        }
        this.subscription = this.modalApply.subscribe((event) => {
            if (event === 'apply') {
                this.apply();
            }
        });
    }
    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    onSelectedFieldsChange(fields) {
        this.selectedFields = fields;
        this.isChecked();
    }

    onSelectedPacketChange(packet) {
        this.selectedPackets = [packet.id];
    }

    apply() {
        this.widget.config.threshold = {
            thresholdActive: this.thresholdActive,
            thresholds: this.selectedThresholds
        }
        this.packetSelect.apply();
    }

    isChecked() {
        this.ruleService.findAllRuleByProjectId(this.widget.projectId).subscribe({
            next: (rules) => {
                if (this.selectedFields.length === 0 && !this.widget.config.packetId) return
                this.thresholds = rules
                    .filter((rule) => {
                        let ruleDefinition = rule.ruleDefinition;
                        if (rule.type !== Rule.TypeEnum.ALARMEVENT) return false;

                        ruleDefinition = ruleDefinition.replace(/"/g, '').trim();
                        const ruleArray: string[] = ruleDefinition.match(/[^AND|OR]+(AND|OR)?/g).map(x => x.trim());
                        const packets: number[] = this.widget.config.packetId
                            ? this.widget.config.packetId
                            : this.selectedPackets;
                        const fields: number[] = this.widget.config.packetFields && Object.keys(this.widget.config.packetFields).length > 0
                            ? [...new Set(Object.keys(this.widget.config.packetFields))].map(field => parseInt(field))
                            : [...new Set(this.selectedFields.map(field => parseInt(field.id)))];

                        for (let k = 0; k < ruleArray.length; k++) {
                            const tempSplitted: string[] = ruleArray[k].split(' ').filter(i => i);
                            const packetFieldPart = tempSplitted.shift();
                            const splitted: string[] = packetFieldPart.split('.');

                            if (this.getOperator(ruleArray[k]) === "=" || this.getOperator(ruleArray[k]) === "!=") return false;

                            if (splitted.length === 1) return false;
                            else if (splitted.length === 2) {
                                if (!(packets && (typeof packets === 'number' ? packets === parseInt(splitted[0]) : packets.includes(parseInt(splitted[0]))) && fields.includes(parseInt(splitted[1])))) {
                                    return false;
                                }
                            }
                        }
                        return true;
                    })
                    .reduce((groupedRules, rule) => {
                        const alarmName = rule.actions[0].alarmName;
                        if (!groupedRules[alarmName]) {
                            groupedRules[alarmName] = [];
                        }
                        groupedRules[alarmName].push(rule);
                        return groupedRules;
                    }, {});
            },
            error: (err) => {
                console.error('Error retrieving thresholds', err);
            }
        })
    }

    /**
     * Extract the operator from the rule part.
     * @param rulePart - A portion of the ruleDefinition to analyze.
     */
    getOperator(rulePart: string): string {
        const tempSplitted = rulePart.split(' ').filter(i => i);
        return tempSplitted.length > 1 ? tempSplitted[1].toLowerCase() : "";
    }

    getSelectedNames(): string {
        if (Object.keys(this.thresholds).length === 0) return;
        const th = this.selectedThresholds
            .map(selectedThreshold => {
                const threshold = this.thresholds[Object.keys(this.thresholds).find(key => this.thresholds[key].find(rule => rule.id === selectedThreshold.id))];
                return threshold.find(th => th.id === selectedThreshold.id).name
            })
            .join(', ');
        this.selectedThresholds = this.widget.config.threshold.thresholds ? this.widget.config.threshold.thresholds : [];
        console.log('this.thresholds', th)
        return th;
    }

    getThresholdName(id: string): string {
        for (const group of Object.keys(this.thresholds)) {
            const rule = this.thresholds[group].find(rule => rule.id === id);
            if (rule) return rule.name;
        }
        return '';
    }

    getThresholdColor(id: string): string {
        const selected = this.selectedThresholds.find(t => t.id === id);
        return selected ? selected.color : '#000000';
    }

    getThresholdIds(): string[] {
        if (!this.thresholds) return [];
        const ids = [];
        Object.keys(this.thresholds).map(key => this.thresholds[key].map(value => ids.push(value.id)));
        this.thresholdsIds = [...new Set(ids)];
        return this.thresholdsIds.length > 0 ? this.thresholdsIds : [];
    }

    formatRulePrettyDefinition(rulePrettyDefinition: string) {
        const parts = rulePrettyDefinition.split('.');
        parts.shift();
        return `${parts[0]}=>${parts.slice(1).join('.')}`;
    }

    onThresholdSelected(selectedId: string) {
        const selectedThreshold = this.selectedThresholds.find(th => th.id === selectedId);
        if (!selectedThreshold) {
            this.selectedThresholds.push({ id: selectedId, color: '#0009' });
            this.newThreshold = {};
        }
    }

    findThresholdRule(id: string) {
        for (const group of Object.keys(this.thresholds)) {
            const rule = this.thresholds[group].find(rule => rule.id === id);
            if (rule) return rule;
        }
        return null;
    }

    canAddMoreThresholds() {
        return this.selectedThresholds.length < this.getThresholdIds().length;
    }
}
