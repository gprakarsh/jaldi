"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const typedjson_1 = require("typedjson");
let Service = class Service {
    constructor(id, name, description, duration, business_id) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.duration = duration;
        this.business_id = business_id;
    }
};
exports.Service = Service;
__decorate([
    (0, typedjson_1.jsonMember)(String),
    __metadata("design:type", String)
], Service.prototype, "id", void 0);
__decorate([
    (0, typedjson_1.jsonMember)(String),
    __metadata("design:type", String)
], Service.prototype, "name", void 0);
__decorate([
    (0, typedjson_1.jsonMember)(String),
    __metadata("design:type", String)
], Service.prototype, "description", void 0);
__decorate([
    (0, typedjson_1.jsonMember)(Number),
    __metadata("design:type", Number)
], Service.prototype, "duration", void 0);
__decorate([
    (0, typedjson_1.jsonMember)(String),
    __metadata("design:type", String)
], Service.prototype, "business_id", void 0);
exports.Service = Service = __decorate([
    typedjson_1.jsonObject,
    __metadata("design:paramtypes", [String, String, String, Number, String])
], Service);