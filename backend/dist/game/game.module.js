"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const rooms_module_1 = require("../rooms/rooms.module");
const users_module_1 = require("../users/users.module");
const game_gateway_1 = require("./game.gateway");
const game_service_1 = require("./game.service");
let GameModule = class GameModule {
};
exports.GameModule = GameModule;
exports.GameModule = GameModule = __decorate([
    (0, common_1.Module)({
        imports: [jwt_1.JwtModule.register({}), users_module_1.UsersModule, rooms_module_1.RoomsModule],
        providers: [game_gateway_1.GameGateway, game_service_1.GameService],
        exports: [game_service_1.GameService],
    })
], GameModule);
//# sourceMappingURL=game.module.js.map