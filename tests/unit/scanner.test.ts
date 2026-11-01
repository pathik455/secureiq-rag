import { parseGitHubRepo } from '@/lib/scanner/github'

describe('GitHub Repository Scanner', () => {
  it('correctly parses various formats of GitHub repository URLs', () => {
    expect(parseGitHubRepo('https://github.com/expressjs/express')).toEqual({
      owner: 'expressjs',
      repo: 'express',
    })

    expect(parseGitHubRepo('github.com/facebook/react/')).toEqual({
      owner: 'facebook',
      repo: 'react',
    })

    expect(parseGitHubRepo('pallets/flask.git')).toEqual({
      owner: 'pallets',
      repo: 'flask',
    })

    expect(parseGitHubRepo('apache/logging-log4j2')).toEqual({
      owner: 'apache',
      repo: 'logging-log4j2',
    })
  })

  it('throws an error on invalid repository formats', () => {
    expect(() => parseGitHubRepo('just-a-name')).toThrow()
    expect(() => parseGitHubRepo('')).toThrow()
  })
})
