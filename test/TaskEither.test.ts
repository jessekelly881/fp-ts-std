import { describe, expect, it } from "@jest/globals"
import * as TE from "fp-ts/TaskEither"
import { constVoid, identity, pipe } from "fp-ts/function"
import { Show as StrShow } from "fp-ts/string"
import { mkMilliseconds } from "../src/Date"
import * as T from "../src/Task"
import {
	pass,
	sequenceSeqArray_,
	traverseArray_,
	traverseSeqArray_,
	unsafeExpect,
	unsafeExpectLeft,
	unsafeUnwrap,
	unsafeUnwrapLeft,
} from "../src/TaskEither"

const msgAndCause = async (f: Promise<unknown>): Promise<[string, unknown]> => {
	try {
		await f
		throw "didn't throw"
	} catch (e) {
		if (!(e instanceof Error)) throw "threw unexpected type"
		return [e.message, e.cause]
	}
}

describe("TaskEither", () => {
	describe("unsafeUnwrap", () => {
		const f = unsafeUnwrap

		it("resolves Right", () => {
			return expect(f(TE.right(123))).resolves.toBe(123)
		})

		it("rejects Left", async () => {
			const [m, c] = await msgAndCause(f(TE.left("l")))

			expect(m).toBe("Unwrapped `Left`")
			expect(c).toBe("l")
		})
	})

	describe("unsafeUnwrapLeft", () => {
		const f = unsafeUnwrapLeft

		it("resolves Left", () => {
			return expect(f(TE.left(123))).resolves.toBe(123)
		})

		it("rejects Right", async () => {
			const [m, c] = await msgAndCause(f(TE.right("r")))

			expect(m).toBe("Unwrapped `Right`")
			expect(c).toBe("r")
		})
	})

	describe("unsafeExpect", () => {
		const f = unsafeExpect(StrShow)

		it("resolves Right", () => {
			return expect(f(TE.right(123))).resolves.toBe(123)
		})

		it("rejects Left via Show", async () => {
			const [m, c] = await msgAndCause(f(TE.left("l")))

			expect(m).toBe("Unwrapped `Left`")
			expect(c).toBe('"l"')
		})
	})

	describe("unsafeExpectLeft", () => {
		const f = unsafeExpectLeft(StrShow)

		it("resolves Left", () => {
			return expect(f(TE.left(123))).resolves.toBe(123)
		})

		it("rejects Right via Show", async () => {
			const [m, c] = await msgAndCause(f(TE.right("r")))

			expect(m).toBe("Unwrapped `Right`")
			expect(c).toBe('"r"')
		})
	})

	describe("sequenceSeqArray_", () => {
		const f = sequenceSeqArray_

		it("sequences sequentially", async () => {
			let n = 0
			const g = pipe(
				TE.fromTask(T.sleep(mkMilliseconds(1))),
				TE.chainFirstIOK(() => () => {
					n = n * 2
				}),
			)
			const h = pipe(
				TE.fromIO(() => {
					n += 5
				}),
				TE.map(constVoid),
			)

			await pipe(f([g, h]), T.execute)

			expect(n).toBe(5)
		})
	})

	describe("traverseArray_", () => {
		const f = traverseArray_

		it("sequences in parallel", async () => {
			let n = 0
			const g = pipe(
				TE.fromTask(T.sleep(mkMilliseconds(1))),
				TE.chainFirstIOK(() => () => {
					n = n * 2
				}),
			)
			const h = pipe(
				TE.fromIO(() => {
					n += 5
				}),
				TE.map(constVoid),
			)

			await pipe(f(identity<TE.TaskEither<unknown, void>>)([g, h]), T.execute)

			expect(n).toBe(10)
		})
	})

	describe("traverseSeqArray_", () => {
		const f = traverseSeqArray_

		it("sequences in parallel", async () => {
			let n = 0
			const g = pipe(
				TE.fromTask(T.sleep(mkMilliseconds(1))),
				TE.chainFirstIOK(() => () => {
					n = n * 2
				}),
			)
			const h = pipe(
				TE.fromIO(() => {
					n += 5
				}),
				TE.map(constVoid),
			)

			await pipe(f(identity<TE.TaskEither<unknown, void>>)([g, h]), T.execute)

			expect(n).toBe(5)
		})
	})

	describe("pass", () => {
		const f = pass

		it("is equivalent to of(undefined)", async () => {
			expect(await unsafeUnwrap(f)).toBe(await unsafeUnwrap(TE.of(undefined)))
		})
	})
})
