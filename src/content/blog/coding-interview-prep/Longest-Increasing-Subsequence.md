---
slug: coding-interview-prep/longest-increasing-subsequence
heroImage: ../../../assets/img/posts/longest-increasing-subsequence/pexels-eessoo-5184791.jpg
category: development
description: >-
  A walkthrough of "Longest Increasing Subsequence": why the natural DFS with
  backtracking solution blows up exponentially, and how dropping the
  in-progress sequence in favor of two indices makes the same recursion
  memoizable in O(n²) time.
pubDate: 2026-07-09T00:00:00.000Z
draft: false
tags:
  - leetcode
  - algorithms
  - java
  - dynamic-programming
  - interview
title: Longest Increasing Subsequence - from exponential backtracking to O(n²)
---

Back to my [running log of coding interview problems](https://github.com/adriangalera/leet): "Longest Increasing Subsequence" is one of the problems that keeps showing up on both the Grind 75 and Neetcode Blind 75 lists, and it's a good one to sit with, because the jump from "obviously correct but exponential" to "polynomial" doesn't come from a clever trick — it comes from noticing that the recursive state is carrying more information than it actually needs to.

## The problem

> Given an integer array `nums`, return the length of the longest strictly increasing subsequence.

A subsequence is derived from the array by deleting some (or no) elements without changing the relative order of what's left — unlike a substring or subarray, the elements you keep don't need to be contiguous.

Full statement on [neetcode.io](https://neetcode.io/problems/longest-increasing-subsequence/question).

```text
Input: nums = [9, 1, 4, 2, 3, 3, 7]
Output: 4
// One longest increasing subsequence is [1, 2, 3, 7]

Input: nums = [0, 1, 0, 3, 2, 3]
Output: 4
// [0, 1, 2, 3] is one valid answer
```

There's no requirement that the subsequence be contiguous, and "strictly increasing" rules out repeating a value — both details matter once you start writing the recursion.

## Framing it as a decision at every index

For every element in `nums`, there are exactly two choices: include it in the subsequence we're building, or skip it and move on. Drawing that out gives a binary decision tree with depth `n` — take the branch on the left and the number joins the sequence, take the branch on the right and it doesn't. The length of the longest increasing subsequence is the depth of the deepest leaf reachable by only ever branching left into numbers that keep the sequence strictly increasing.

## Brute force: DFS with backtracking

The most literal way to explore that tree is to actually carry the sequence built so far, try adding the current number to it when it's legal, recurse, then undo that addition before trying the "skip it" branch:

```java
public int lengthOfLIS(int[] nums) {
    return dfs(nums, 0, new ArrayList<>());
}

private int dfs(int[] nums, int i, List<Integer> sequence) {
    if (i == nums.length) {
        return sequence.size();
    }

    // don't include nums[i]
    int without = dfs(nums, i + 1, sequence);

    // include nums[i], only if it keeps the sequence strictly increasing
    int with = 0;
    if (sequence.isEmpty() || sequence.get(sequence.size() - 1) < nums[i]) {
        sequence.add(nums[i]);
        with = dfs(nums, i + 1, sequence);
        sequence.remove(sequence.size() - 1);
    }

    return Math.max(with, without);
}
```

This is correct — every legal subsequence is explored, and we take the longest one found. The backtracking (`add` then `remove`) is what lets a single mutable `sequence` list stand in for the many different partial sequences the recursion visits, without allocating a new list at every call.

The cost is that we branch twice at every one of the `n` indices, so the recursion tree has up to **2ⁿ** leaves — that's the time complexity. Space is **O(n)**: the recursion depth and the sequence itself are both bounded by the length of the array, and only one path is held in memory at a time (the backtracking cleans up after itself before trying the other branch).

## Dropping the sequence: index instead of value

2ⁿ is unusable for anything past a few dozen elements, and the standard fix for exponential DFS is memoization — caching a `(state) → result` mapping so repeated states are computed once. But the `sequence` list can't be a cache key: two different call paths almost never produce the same list object, and even if they did, comparing or hashing a growing `List<Integer>` at every call would be its own cost.

Look closely at what the recursion actually _needs_ from `sequence`, though: only its last element, to decide whether `nums[i]` is legal to add. Everything before that is irrelevant to any future decision. So instead of passing the whole sequence, we can pass the index of the last number we committed to — call it `j` — and compare `nums[j]` against `nums[i]` directly:

```java
public int lengthOfLIS(int[] nums) {
    return dfs(nums, 0, -1);
}

private int dfs(int[] nums, int i, int j) {
    if (i == nums.length) {
        return 0;
    }

    int withoutNum = dfs(nums, i + 1, j);

    int withNum = 0;
    if (j == -1 || nums[j] < nums[i]) {
        withNum = dfs(nums, i + 1, i) + 1;
    }

    return Math.max(withNum, withoutNum);
}
```

`j` starts at `-1` to mean "nothing picked yet, anything is legal." When we do include `nums[i]`, the next call's "last picked" index becomes `i` — we don't need to remember anything further back than that. This has the exact same **O(2ⁿ)** time and **O(n)** space as the backtracking version (we haven't cached anything yet), but it's done something more important: the state of a call is now the pair of primitives `(i, j)`, which is trivially cacheable, unlike a mutable list.

## The optimal approach: memoize on (i, j)

Once the state is just two integers, memoization is a matter of storing results by that pair and checking the cache before recursing:

```java
public int lengthOfLIS(int[] nums) {
    Integer[][] memo = new Integer[nums.length][nums.length + 1];
    return dfs(nums, 0, -1, memo);
}

private int dfs(int[] nums, int i, int j, Integer[][] memo) {
    if (i == nums.length) {
        return 0;
    }
    if (memo[i][j + 1] != null) {
        return memo[i][j + 1];
    }

    int withoutNum = dfs(nums, i + 1, j, memo);

    int withNum = 0;
    if (j == -1 || nums[j] < nums[i]) {
        withNum = dfs(nums, i + 1, i, memo) + 1;
    }

    int best = Math.max(withNum, withoutNum);
    memo[i][j + 1] = best;
    return best;
}
```

The one wrinkle is that `j` legitimately takes the value `-1`, and Java arrays don't do negative indices. Shifting every lookup by one (`memo[i][j + 1]`) fixes that with no change in behavior — it's a detail worth watching for any time a memo key is derived from an index that can start "before the array."

### Why this is O(n²)

The recursion only ever gets called with `i` ranging over `0..n` and `j` ranging over `-1..n-1`, so there are at most `n * (n + 1)` distinct `(i, j)` pairs — **O(n²)** possible states. Memoization guarantees each state is computed once: the first time we see a given `(i, j)` we do the actual work and store it, every subsequent call with the same pair is an O(1) array lookup. Since the work done per state (outside of the two recursive calls, which are what the memo check short-circuits) is O(1), total time is O(n²) — a direct consequence of bounding the number of _states_, not the number of _calls_ (which without memoization would still be exponential).

Space is **O(n²)** too, dominated by the `memo` table itself (`n` rows by `n + 1` columns), not by the recursion — the call stack still only goes `n` frames deep at any point, same as the earlier versions. It's worth being precise about this: the memo table is what buys the speedup, and it's also the biggest line item in the space budget, larger than the O(n) the naive versions needed.

## Takeaway

Exponential DFS on a decision tree almost always has a polynomial dynamic-programming solution hiding behind it — the trick is figuring out the smallest amount of information a call actually needs to make its decision, separate from however the recursion happens to be passing state around. Here that meant realizing "the sequence so far" collapses to "the index of its last element," which turns an uncacheable, ever-growing list into two primitive ints and makes the whole problem memoizable. Whenever you're stuck at O(2ⁿ), ask what your recursive function's parameters would look like if you stripped out everything not strictly required to answer "what happens next" — that's usually your memo key.
