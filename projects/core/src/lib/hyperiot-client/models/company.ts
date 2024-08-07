/**
 * OpenAPI spec version: 2.0.0
 * Contact: users@acsoftware.it
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
import { HUser } from './hUser';


export interface Company { 
    id?: number;
    entityVersion: number;
    readonly entityCreateDate?: Date;
    readonly entityModifyDate?: Date;
    businessName?: string;
    invoiceAddress?: string;
    city?: string;
    postalCode?: string;
    nation?: string;
    vatNumber?: string;
    hUserCreator?: HUser;
}
