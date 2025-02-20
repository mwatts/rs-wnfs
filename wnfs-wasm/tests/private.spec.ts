///<reference path="server/index.d.ts"/>

import { expect, test } from "@playwright/test";

const url = "http://localhost:8085";

test.beforeEach(async ({ page }) => {
  await page.goto(url);
  await page.waitForFunction(() => window.setup != null);
});

test.describe("PrivateDirectory", () => {
  test("lookupNode can fetch file added to directory", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const {
        wnfs: { PrivateDirectory, PrivateForest },
        mock: { MemoryBlockStore, Rng },
      } = await window.setup();

      const rng = new Rng();
      const store = new MemoryBlockStore();
      const initialForest = new PrivateForest(rng);
      const root = new PrivateDirectory(initialForest.emptyName(), new Date(), rng);

      var { rootDir, forest } = await root.write(
        ["text.txt"],
        true,
        new Uint8Array([1, 2, 3, 4, 5]),
        new Date(),
        initialForest,
        store,
        rng
      );

      return await rootDir.lookupNode("text.txt", true, forest, store);
    });

    expect(result).toBeDefined();
  });

  test("getNode can fetch node from root dir", async ({ page }) => {
    const [result0, result1] = await page.evaluate(async (): Promise<any[]> => {
      const {
        wnfs: { PrivateDirectory, PrivateForest },
        mock: { MemoryBlockStore, Rng },
      } = await window.setup();

      const rng = new Rng();
      const store = new MemoryBlockStore();
      const initialForest = new PrivateForest(rng);
      const root = new PrivateDirectory(initialForest.emptyName(), new Date(), rng);

      var { rootDir, forest } = await root.mkdir(
        ["pictures", "dogs"],
        true,
        new Date(),
        initialForest,
        store,
        rng
      );

      var { rootDir, forest } = await rootDir.write(
        ["pictures", "cats", "tabby.png"],
        true,
        new Uint8Array([1, 2, 3, 4, 5]),
        new Date(),
        forest,
        store,
        rng
      );

      var result0 = await rootDir.getNode(
        ["pictures", "cats", "tabby.png"],
        true,
        forest,
        store
      );

      var result1 = await rootDir.getNode(
        ["pictures", "dogs", "bingo.png"],
        true,
        forest,
        store
      );

      console.log(result0);
      console.log(result1);

      return [result0, result1];
    });

    expect(result0).toBeDefined();
    expect(result1).toBeUndefined();
  });

  test("lookupNode cannot fetch file not added to directory", async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const {
        wnfs: { PrivateDirectory, PrivateForest },
        mock: { MemoryBlockStore, Rng },
      } = await window.setup();

      const rng = new Rng();
      const store = new MemoryBlockStore();
      const initialForest = new PrivateForest(rng);
      const root = new PrivateDirectory(initialForest.emptyName(), new Date(), rng);

      return await root.lookupNode("Unknown", true, initialForest, store);
    });

    expect(result).toBe(undefined);
  });

  test("mkdir can create new directory", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const {
        wnfs: { PrivateDirectory, PrivateForest },
        mock: { MemoryBlockStore, Rng },
      } = await window.setup();

      const rng = new Rng();
      const store = new MemoryBlockStore();
      const initialForest = new PrivateForest(rng);
      const root = new PrivateDirectory(initialForest.emptyName(), new Date(), rng);

      var { rootDir, forest } = await root.mkdir(
        ["pictures", "cats"],
        true,
        new Date(),
        initialForest,
        store,
        rng
      );

      var { rootDir, forest } = await rootDir.write(
        ["pictures", "cats", "tabby.png"],
        true,
        new Uint8Array([1, 2, 3, 4, 5]),
        new Date(),
        forest,
        store,
        rng
      );

      var result = await rootDir.getNode(
        ["pictures", "cats", "tabby.png"],
        true,
        forest,
        store
      );

      return result;
    });

    expect(result).toBeDefined();
  });

  test("ls can list children under directory", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const {
        wnfs: { PrivateDirectory, PrivateForest },
        mock: { MemoryBlockStore, Rng },
      } = await window.setup();

      const rng = new Rng();
      const store = new MemoryBlockStore();
      const initialForest = new PrivateForest(rng);
      const root = new PrivateDirectory(initialForest.emptyName(), new Date(), rng);

      var { rootDir, forest } = await root.mkdir(
        ["pictures", "dogs"],
        true,
        new Date(),
        initialForest,
        store,
        rng
      );

      var { rootDir, forest } = await rootDir.write(
        ["pictures", "cats", "tabby.png"],
        true,
        new Uint8Array([1, 2, 3, 4, 5]),
        new Date(),
        forest,
        store,
        rng
      );

      var { result } = await rootDir.ls(["pictures"], true, forest, store);

      return result;
    });

    expect(result.length).toBe(2);
    expect(result[0].name).toBe("cats");
    expect(result[1].name).toBe("dogs");
  });

  test("rm can remove children from directory", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const {
        wnfs: { PrivateDirectory, PrivateForest },
        mock: { MemoryBlockStore, Rng },
      } = await window.setup();

      const rng = new Rng();
      const store = new MemoryBlockStore();
      const initialForest = new PrivateForest(rng);
      const root = new PrivateDirectory(initialForest.emptyName(), new Date(), rng);

      var { rootDir, forest } = await root.write(
        ["pictures", "dogs", "billie.jpeg"],
        true,
        new Uint8Array([1, 2, 3, 4, 5]),
        new Date(),
        initialForest,
        store,
        rng
      );

      var { rootDir, forest } = await rootDir.write(
        ["pictures", "cats", "tabby.png"],
        true,
        new Uint8Array([1, 2, 3, 4, 5]),
        new Date(),
        forest,
        store,
        rng
      );

      var { rootDir, forest } = await rootDir.rm(
        ["pictures", "cats"],
        true,
        forest,
        store,
        rng
      );

      var { result } = await rootDir.ls(["pictures"], true, forest, store);

      return result;
    });

    expect(result.length).toEqual(1);
    expect(result[0].name).toEqual("dogs");
  });

  test("basicMv can move content between directories", async ({ page }) => {
    const [imagesContent, picturesContent] = await page.evaluate(async () => {
      const {
        wnfs: { PrivateDirectory, PrivateForest },
        mock: { MemoryBlockStore, Rng },
      } = await window.setup();

      const rng = new Rng();
      const store = new MemoryBlockStore();
      const initialForest = new PrivateForest(rng);
      const root = new PrivateDirectory(initialForest.emptyName(), new Date(), rng);

      var { rootDir, forest } = await root.write(
        ["pictures", "cats", "luna.jpeg"],
        true,
        new Uint8Array([1, 2, 3, 4, 5]),
        new Date(),
        initialForest,
        store,
        rng
      );

      var { rootDir, forest } = await rootDir.write(
        ["pictures", "cats", "tabby.png"],
        true,
        new Uint8Array([1, 2, 3, 4, 5]),
        new Date(),
        forest,
        store,
        rng
      );

      var { rootDir, forest } = await rootDir.mkdir(
        ["images"],
        true,
        new Date(),
        forest,
        store,
        rng
      );

      var { rootDir, forest } = await rootDir.basicMv(
        ["pictures", "cats"],
        ["images", "cats"],
        true,
        new Date(),
        forest,
        store,
        rng
      );

      var { result: imagesContent, forest } = await rootDir.ls(
        ["images"],
        true,
        forest,
        store
      );

      var { result: picturesContent, forest } = await rootDir.ls(
        ["pictures"],
        true,
        forest,
        store
      );

      return [imagesContent, picturesContent];
    });

    expect(imagesContent.length).toEqual(1);
    expect(picturesContent.length).toEqual(0);
    expect(imagesContent[0].name).toEqual("cats");
  });

  test("cp can copy content between directories", async ({ page }) => {
    const [imagesContent, picturesContent] = await page.evaluate(async () => {
      const {
        wnfs: { PrivateDirectory, PrivateForest },
        mock: { MemoryBlockStore, Rng },
      } = await window.setup();

      const rng = new Rng();
      const store = new MemoryBlockStore();
      const initialForest = new PrivateForest(rng);
      const root = new PrivateDirectory(initialForest.emptyName(), new Date(), rng);

      var { rootDir, forest } = await root.write(
        ["pictures", "cats", "luna.jpeg"],
        true,
        new Uint8Array([1, 2, 3, 4, 5]),
        new Date(),
        initialForest,
        store,
        rng
      );

      var { rootDir, forest } = await rootDir.write(
        ["pictures", "cats", "tabby.png"],
        true,
        new Uint8Array([1, 2, 3, 4, 5]),
        new Date(),
        forest,
        store,
        rng
      );

      var { rootDir, forest } = await rootDir.mkdir(
        ["images"],
        true,
        new Date(),
        forest,
        store,
        rng
      );

      var { rootDir, forest } = await rootDir.cp(
        ["pictures", "cats"],
        ["images", "cats"],
        true,
        new Date(),
        forest,
        store,
        rng
      );

      var { result: imagesContent, forest } = await rootDir.ls(
        ["images"],
        true,
        forest,
        store
      );

      var { result: picturesContent, forest } = await rootDir.ls(
        ["pictures"],
        true,
        forest,
        store
      );

      return [imagesContent, picturesContent];
    });

    expect(imagesContent.length).toEqual(1);
    expect(picturesContent.length).toEqual(1);

    expect(imagesContent[0].name).toEqual("cats");
    expect(picturesContent[0].name).toEqual("cats");
  });
});

test.describe("PrivateFile", () => {
  test("empty can create empty file", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const {
        wnfs: { PrivateFile, PrivateForest },
        mock: { Rng },
      } = await window.setup();

      const rng = new Rng();
      const forest = new PrivateForest(rng);
      const file = new PrivateFile(forest.emptyName(), new Date(), rng);

      return file.getId();
    });

    expect(result).toBeDefined();
  });

  test("withContent can create file with content", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const {
        wnfs: { PrivateFile, PrivateForest },
        mock: { MemoryBlockStore, Rng },
      } = await window.setup();

      const rng = new Rng();
      const forest = new PrivateForest(rng);
      const store = new MemoryBlockStore();
      const [file] = await PrivateFile.withContent(
        forest.emptyName(),
        new Date(),
        new Uint8Array([1, 2, 3, 4, 5]),
        forest,
        store,
        rng
      );

      return file.getId();
    });

    expect(result).toBeDefined();
  });

  test("getContent can fetch file's entire content", async ({ page }) => {
    const [length, type] = await page.evaluate(async () => {
      const {
        wnfs: { PrivateFile, PrivateForest },
        mock: { MemoryBlockStore, Rng },
      } = await window.setup();

      const rng = new Rng();
      const initialForest = new PrivateForest(rng);
      const store = new MemoryBlockStore();
      var [file, forest] = await PrivateFile.withContent(
        initialForest.emptyName(),
        new Date(),
        new Uint8Array([1, 2, 3, 4, 5]),
        initialForest,
        store,
        rng
      );

      let content = await file.getContent(forest, store);

      return [content.length, content.constructor.name, content];
    });

    expect(length).toEqual(5);
    expect(type).toEqual("Uint8Array");
  });

  test("A PrivateDirectory has the correct metadata", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const {
        wnfs: { PrivateDirectory, PrivateForest },
        mock: { Rng },
      } = await window.setup();

      const rng = new Rng();
      const forest = new PrivateForest(rng);
      const time = new Date();
      return new PrivateDirectory(forest.emptyName(), time, rng).metadata();
    });

    expect(result.created).not.toBeUndefined();
  });

  test("A PrivateFile has the correct metadata", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const {
        wnfs: { PrivateFile, PrivateForest },
        mock: { Rng },
      } = await window.setup();

      const rng = new Rng();
      const forest = new PrivateForest(rng);
      const time = new Date();
      return new PrivateFile(forest.emptyName(), time, rng).metadata();
    });

    expect(result.created).not.toBeUndefined();
  });
});

test.describe("PrivateNode", () => {
  test("load returns what was stored", async ({ page }) => {
    const [metadataBefore, metadataAfter] = await page.evaluate(async () => {
      const {
        wnfs: { PrivateFile, PrivateNode, PrivateForest },
        mock: { MemoryBlockStore, Rng },
      } = await window.setup();

      const rng = new Rng();
      const store = new MemoryBlockStore();
      const forest = new PrivateForest(rng);
      const time = new Date();
      const file = new PrivateFile(forest.emptyName(), time, rng);
      const node = file.asNode();
      const [privateRef, newForest] = await node.store(forest, store, rng);
      const fetched = await PrivateNode.load(privateRef, newForest, store);
      const metadataBefore = node.asFile().metadata();
      const metadataAfter = fetched.asFile().metadata();
      return [metadataBefore, metadataAfter];
    });

    expect(metadataBefore).toBeDefined();
    expect(metadataAfter).toBeDefined();
    expect(metadataBefore.created).toEqual(metadataAfter.created);
    expect(metadataBefore.modified).toEqual(metadataAfter.modified);
  });

  test("searchLatest finds latest", async ({ page }) => {
    const [lsResultBefore, lsResultAfter] = await page.evaluate(async () => {
      const {
        wnfs: { PrivateDirectory, PrivateNode, PrivateForest },
        mock: { MemoryBlockStore, Rng },
      } = await window.setup();

      const rng = new Rng();
      const store = new MemoryBlockStore();
      const forest0 = new PrivateForest(rng);
      const time = new Date();

      // Create a root directory and store
      const rootDir0 = new PrivateDirectory(forest0.emptyName(), time, rng);
      const [accessKey, forest1] = await rootDir0.store(forest0, store, rng);

      // Write something to the directory and store it
      const { rootDir: rootDir1, forest: forest2 } = await rootDir0.write(["some", "file.txt"], true, new Uint8Array([0]), time, forest1, store, rng);
      const [_, forest3] = await rootDir1.asNode().store(forest2, store, rng);

      // loading back the *old* directory using its access key should give an empty directory:
      const oldNode = await PrivateNode.load(accessKey, forest3, store);
      const { result: lsResultBefore } = await oldNode.asDir().ls([], false, forest3, store);

      // loading back the directory with search latest should work:
      const latestNode = await oldNode.searchLatest(forest3, store);
      const { result: lsResultAfter } = await latestNode.asDir().ls([], false, forest3, store);

      return [lsResultBefore, lsResultAfter];
    });

    expect(lsResultBefore).toBeDefined();
    expect(lsResultAfter).toBeDefined();
    expect(lsResultBefore).toEqual([]);
    expect(lsResultAfter.length).toEqual(1);
    expect(lsResultAfter[0].name).toEqual("some");
  })
})

test.describe("PrivateForest", () => {
  test("store returns a PrivateRef", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const {
        wnfs: { PrivateFile, PrivateForest },
        mock: { MemoryBlockStore, Rng, CID },
      } = await window.setup();

      const rng = new Rng();
      const store = new MemoryBlockStore();
      const forest = new PrivateForest(rng);
      const time = new Date();
      const file = new PrivateFile(forest.emptyName(), time, rng);
      const node = file.asNode();
      const [privateRef, _] = await node.store(forest, store, rng);
      return {
        // Need to be converted to arrays so they can be passed as JSON
        label: Array.from(privateRef.getLabel()),
        temporalKey: Array.from(privateRef.getTemporalKey()),
        contentCid: CID.decode(privateRef.getContentCid()).toString(),
      };
    });

    expect(result.label.length).toEqual(32);
    expect(result.temporalKey.length).toEqual(32);
    expect(result.contentCid).toBeDefined();
  });

  test("diff gets changes in forests", async ({ page }) => {
    const changes = await page.evaluate(async () => {
      const {
        wnfs: { PrivateFile, PrivateDirectory, PrivateForest },
        mock: { MemoryBlockStore, Rng },
      } = await window.setup();

      const rng = new Rng();
      const store = new MemoryBlockStore();
      const time = new Date();

      var mainForest: any = new PrivateForest(rng);
      var otherForest: any = mainForest;

      const file = new PrivateFile(mainForest.emptyName(), time, rng).asNode();
      const dir = new PrivateDirectory(mainForest.emptyName(), time, rng).asNode();

      var [_, mainForest] = await file.store(mainForest, store, rng);
      var [_, otherForest] = await dir.store(otherForest, store, rng);

      const diff = await mainForest.diff(otherForest, store);

      return diff.map((change: any) => change.getChangeType());
    });

    expect(changes.length).toEqual(2);
    expect(changes).toContain("add");
    expect(changes).toContain("remove");
  });

  test("merge combines changes in forests", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const {
        wnfs: {
          PrivateFile,
          PrivateDirectory,
          PrivateForest,
          PrivateNode,
        },
        mock: { MemoryBlockStore, Rng },
      } = await window.setup();

      const rng = new Rng();
      const store = new MemoryBlockStore();
      const time = new Date();

      var mainForest: any = new PrivateForest(rng);
      var otherForest: any = mainForest;

      const file = new PrivateFile(mainForest.emptyName(), time, rng).asNode();
      const dir = new PrivateDirectory(mainForest.emptyName(), time, rng).asNode();

      var [_, mainForest] = await file.store(mainForest, store, rng);
      var [privateRef, otherForest] = await dir.store(otherForest, store, rng);

      const mergeForest = await mainForest.merge(otherForest, store);

      return await PrivateNode.load(privateRef, mergeForest, store);
    });

    expect(result).toBeDefined();
  });
});

test.describe("AccessKey", () => {
  test("can encode / decode an access key", async ({ page }) => {
    const [metadataBefore, metadataAfter] = await page.evaluate(async () => {
      const {
        wnfs: { AccessKey, PrivateFile, PrivateNode, PrivateForest },
        mock: { MemoryBlockStore, Rng },
      } = await window.setup();


      const rng = new Rng();
      const store = new MemoryBlockStore();
      const forest = new PrivateForest(rng);
      const time = new Date();
      const file = new PrivateFile(forest.emptyName(), time, rng);
      const node = file.asNode();
      const [accessKey, newForest] = await node.store(forest, store, rng);

      const encodedAccessKey = accessKey.toBytes();
      const decodedAccessKey = AccessKey.fromBytes(encodedAccessKey);

      const fetched = await PrivateNode.load(decodedAccessKey, newForest, store);
      const metadataBefore = node.asFile().metadata();
      const metadataAfter = fetched.asFile().metadata();
      return [metadataBefore, metadataAfter];
    });

    expect(metadataBefore).toBeDefined();
    expect(metadataAfter).toBeDefined();
    expect(metadataBefore.created).toEqual(metadataAfter.created);
    expect(metadataBefore.modified).toEqual(metadataAfter.modified);
  });
});
