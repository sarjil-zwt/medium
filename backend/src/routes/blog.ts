import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { createBlogInput, updateBlogInput } from "@sarjilpatel/common-app";
import { Hono } from "hono";
import { verify } from "hono/jwt";

const blogRoutes = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRoutes.use("/*", async (c, next) => {
  const authHeader = c.req.header("Authorization") || "";

  try {
    const user = await verify(authHeader, c.env.JWT_SECRET);

    if (user) {
      // Explicitly cast user.id to string
      c.set("userId", user.id as string);
      await next();
    } else {
      return c.json(
        {
          message: "You are not logged in",
        },
        401
      );
    }
  } catch (error) {
    return c.json(
      {
        message: "Invalid token",
      },
      401
    );
  }
});

blogRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      return c.json({ message: "Blog not found" }, 404);
    }

    return c.json(blog);
  } catch (error) {
    console.error(error);
    return c.json({ message: "Error fetching blog" }, 500);
  }
});

blogRoutes.post("/", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    const { success } = createBlogInput?.safeParse(body);

    if (!success) {
      c.json({
        message: "Please check inputfields",
      });
    }

    const newBlog = await prisma.blog.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: c.get("userId"),
      },
    });

    return c.json(newBlog, 201);
  } catch (error) {
    console.error(error);
    return c.json({ message: "Error creating blog" }, 500);
  }
});

blogRoutes.get("/", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blogs = await prisma.blog.findMany();

    return c.json(blogs);
  } catch (error) {
    console.error(error);
    return c.json({ message: "Error fetching blogs" }, 500);
  }
});

blogRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ message: "Unauthorized access" }, 401);
  }

  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    const { success } = updateBlogInput?.safeParse(body);

    if (!success) {
      c.json({
        message: "Please check inputfields",
      });
    }

    const existingBlog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!existingBlog) {
      return c.json({ message: "Blog not found" }, 404);
    }

    if (existingBlog.authorId !== userId) {
      return c.json(
        { message: "You are not authorized to update this blog" },
        403
      );
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        title: body.title,
        content: body.content,
      },
    });

    return c.json(updatedBlog);
  } catch (error) {
    if (error instanceof Error) {
      if ((error as any).code === "P2025") {
        return c.json({ message: "Blog not found" }, 404);
      }
      console.error(error.message);
      return c.json({ message: "Error updating blog: " + error.message }, 500);
    }

    console.error("Unexpected error:", error);
    return c.json({ message: "Unexpected error occurred" }, 500);
  }
});

export default blogRoutes;
