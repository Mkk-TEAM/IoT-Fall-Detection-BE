import { InternalServerError } from "./handleError.js";

export function getSaltRounds() {
    const parsed = Number.parseInt(process.env.SALT_ROUNDS, 10);

    if (!Number.isInteger(parsed) || parsed < 4 || parsed > 15) {
        throw new InternalServerError(
            "Cấu hình SALT_ROUNDS không hợp lệ. Vui lòng kiểm tra biến môi trường.",
        );
    }

    return parsed;
}
