import auth from "./auth/auth";
import { decodeToken } from "./auth/jwt";
import factory from "./factory";

const app = factory.createApp()
.use(decodeToken)
.route('/auth', auth)

export default app;