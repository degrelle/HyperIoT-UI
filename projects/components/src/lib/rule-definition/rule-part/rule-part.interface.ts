import { ValidatorFn } from "@angular/forms";
import { HPacketField, RuleNode } from "core";

export type FieldType = 'select' | 'text' | 'select-group';

export interface RuleOperator {
    appliance: RuleNode.ApplianceEnum;
    name: string;
    operator: string;
    supportedFieldTypes: HPacketField.TypeEnum;
}

export interface IRulePart {
    fieldType: FieldType;
    label: string;
    validators: ValidatorFn[],
    generateOptions?();
    generateChildrenRuleParts?(): Map<string, IRulePart>;
    ruleify: (value: string) => string;
    prettify: (value: string) => string;
}
