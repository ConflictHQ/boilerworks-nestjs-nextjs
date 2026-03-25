var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { Controller, Get, Post } from "@nestjs/common";
let AuthController = (() => {
    let _classDecorators = [Controller("auth")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _login_decorators;
    let _logout_decorators;
    let _me_decorators;
    var AuthController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _login_decorators = [Post("login")];
            _logout_decorators = [Post("logout")];
            _me_decorators = [Get("me")];
            __esDecorate(this, null, _login_decorators, { kind: "method", name: "login", static: false, private: false, access: { has: obj => "login" in obj, get: obj => obj.login }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _logout_decorators, { kind: "method", name: "logout", static: false, private: false, access: { has: obj => "logout" in obj, get: obj => obj.logout }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _me_decorators, { kind: "method", name: "me", static: false, private: false, access: { has: obj => "me" in obj, get: obj => obj.me }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AuthController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        auth = __runInitializers(this, _instanceExtraInitializers);
        prisma;
        constructor(auth, prisma) {
            this.auth = auth;
            this.prisma = prisma;
        }
        async login(body, res) {
            const user = await this.prisma.user.findUnique({
                where: { email: body.email },
            });
            if (!user || !user.passwordHash) {
                return res.status(401).json({ error: "Invalid credentials" });
            }
            if (!this.auth.verifyPassword(body.password, user.passwordHash)) {
                return res.status(401).json({ error: "Invalid credentials" });
            }
            if (!user.isActive) {
                return res.status(403).json({ error: "Account deactivated" });
            }
            const { token } = await this.auth.createSession(user.id);
            res.cookie("backend_jwt", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                path: "/",
            });
            return res.json({ ok: true, token });
        }
        async logout(req, res) {
            const token = req.cookies?.backend_jwt ||
                req.headers.authorization?.replace("Bearer ", "");
            if (token) {
                await this.auth.destroySession(token);
            }
            res.clearCookie("backend_jwt");
            return res.json({ ok: true });
        }
        async me(req, res) {
            const token = req.cookies?.backend_jwt ||
                req.headers.authorization?.replace("Bearer ", "");
            if (!token) {
                return res.status(401).json({ error: "Not authenticated" });
            }
            const user = await this.auth.validateSession(token);
            if (!user) {
                return res.status(401).json({ error: "Invalid session" });
            }
            return res.json({
                id: user.id,
                email: user.email,
                name: user.name,
                isSuperuser: user.isSuperuser,
                isStaff: user.isStaff,
            });
        }
    };
    return AuthController = _classThis;
})();
export { AuthController };
//# sourceMappingURL=auth.controller.js.map