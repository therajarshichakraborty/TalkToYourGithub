import { corsair } from "./corsair";

// With multiTenancy: true, all plugin access must go through withTenant()
// corsair.github is undefined - that's correct and expected

const tenant = corsair.withTenant("test_user") as any;
await tenant.github.keys.set_api_key(process.env.GITHUB_TOKEN!);

// const result = await tenant.github.api.repositories.listCommits({
//     owner: "therajarshichakraborty",
//     repo: "Rajarshi-s-Portfolio",
//     perPage: 100,
//     page: 2
// });

// let count = 0;
// (result as any[]).forEach((element: any) => {
//     count++;
//     console.log(`${count}. ${element.commit.message}`);
// });

// let allCommits: any[] = [];
// let page = 1;

// while (true) {
//     const commits = (await tenant.github.api.repositories.listCommits({
//         owner: "therajarshichakraborty",
//         repo: "Rajarshi-s-Portfolio",
//         perPage: 100,
//         page: page,
//     })) as any[];
//     let count = 0;
//     (commits as any[]).forEach((element: any) => {
//         count++;
//         console.log(`${count}. ${element.commit.message}`);
//     });

//     if (!commits || commits.length === 0) break;
//     allCommits.push(...commits);

//     if (commits.length < 100) break;
//     page++;
// }

// console.log(`Total commits fetched: ${allCommits.length}`);

let allRepos: any[] = [];
let page = 1;

while (true) {
  const repos = (await tenant.github.api.repositories.list({
    perPage: 100,
    page: page,
  })) as any[];

  if (!repos || repos.length === 0) break;
  allRepos.push(...repos);

  // let count = 0;
  // (repos as any[]).forEach((element: any) => {
  //     count++;
  //     console.log(`${count}. ${element.fullName}`);
  // });

  if (repos.length < 100) break; // Reached the last page
  page++;
}

allRepos.forEach((element) => {
  console.log(element.name);
});

console.log("Total number of repos:", allRepos.length);
