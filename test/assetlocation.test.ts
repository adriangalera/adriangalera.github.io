import * as fs from 'fs'
import * as path from 'path'
import { expect, test } from 'vitest'

const getAllFilesInDirectory = async (directory: string): Promise<string[]> => {
	return await fs.readdirSync(directory).map((file) => path.join(directory, file))
}

test('Page should link assets correctly', async () => {
	const files = await getAllFilesInDirectory('./src/content/blog')
	for (let file of files) {
		const fileContent = fs.readFileSync(file, 'utf8')
		expect(fileContent, `file ${file} should not contain references to /src/assets`).to.not.contain(
			'/src/assets'
		)
	}
})
