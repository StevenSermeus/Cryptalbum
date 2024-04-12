import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    console.log(req.nextauth);
    //redirect to signin page if token is not present
    if (!req.nextauth?.token) {
      return NextResponse.redirect("/auth/signin");
    }
  },
  {
    callbacks: {
      authorized: (params) => {
        let { token } = params;
        return !!token;
      },
    },
  },
);
// Match a route like `/demo`
export const config = { matcher: ["/demo"] };
