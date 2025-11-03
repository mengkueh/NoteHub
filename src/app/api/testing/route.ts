// // import type { NextApiRequest, NextApiResponse } from "next";
// // import { prisma } from "@/lib/prisma";

// // export default async function handler(req: NextApiRequest, res: NextApiResponse){
// //     if (req.method !== "POST") return res.status(405).json({ error: "Metohod note allowed" });

// //     const { email } = req.body;
// //     if (!email) return res.status(400).json({ error: "email is required" });

// //     try {
// //         const posts = await prisma.post.findUnique({
// //             where: { email },
// //             select: { notes: true },
// //         });

// //         return res.status(200).json({ email, notes: posts });
// //     } catch (err) {
// //         console.error(err);
// //         return res.status(500).json({ error: "Server error" });
// //     }
// // }

// // src/app/api/notesByEmail/route.ts
// // app/api/notesbyemail/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     console.log("[API] /api/notesbyemail body:", body);

//     const email = body?.email;
//     if (!email) {
//       console.log("[API] missing email");
//       return NextResponse.json({ error: "Email is required" }, { status: 400 });
//     }

//     const post = await prisma.post.findUnique({
//       where: { email },
//       include: { notes: true },
//     });

//     console.log("[API] found post:", post ? { id: post.id, email: post.email, notesCount: post.notes.length } : null);

//     if (!post) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     // 确保返回的是数组（notes）
//     return NextResponse.json(post.notes);
//   } catch (err) {
//     console.error("[API] error:", err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }
