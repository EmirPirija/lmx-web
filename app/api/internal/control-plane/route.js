import { NextResponse } from "next/server";
import { getAdminControlPlane } from "@/lib/server/adminControlPlane";

const createRequestId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `control_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

export async function GET(request) {
  const requestId = request.headers.get("x-request-id") || createRequestId();

  try {
    const { controlPlane } = await getAdminControlPlane();
    return NextResponse.json(
      {
        error: false,
        data: controlPlane,
        trace_id: requestId,
      },
      {
        status: 200,
        headers: {
          "x-request-id": requestId,
          "x-correlation-id": requestId,
          "cache-control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        error: true,
        message: "Control plane trenutno nije dostupan.",
        trace_id: requestId,
      },
      {
        status: 503,
        headers: {
          "x-request-id": requestId,
          "x-correlation-id": requestId,
          "cache-control": "no-store",
        },
      },
    );
  }
}

