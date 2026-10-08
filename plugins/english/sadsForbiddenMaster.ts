import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { load as parseHTML } from 'cheerio';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';

class SadsForbiddenMaster implements Plugin.PluginBase {
  id = 'sadsForbiddenMaster';
  name = 'Sads Translates - Forbidden Master';
  icon = '';
  site = 'https://sadstranslates.page';
  version = '1.0.0';

  private novelPath = '/projects/forbidden-master/';

  async popularNovels(
    pageNo: number,
    {
      showLatestNovels,
      filters,
    }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    if (pageNo !== 1) {
      return [];
    }

    return [
      {
        name: 'Breakthrough with the Forbidden Master',
        path: this.novelPath,
        cover:
          'https://sadstranslates.page/wp-content/uploads/2019/11/818ay2fgbal._ac_sl1500_.jpg?w=720',
      },
    ];
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    if (pageNo !== 1) {
      return [];
    }

    const query = searchTerm.trim().toLowerCase();

    if (
      !query ||
      'breakthrough with the forbidden master'.includes(query) ||
      'forbidden master'.includes(query)
    ) {
      return [
        {
          name: 'Breakthrough with the Forbidden Master',
          path: this.novelPath,
          cover:
            'https://sadstranslates.page/wp-content/uploads/2019/11/818ay2fgbal._ac_sl1500_.jpg?w=720',
        },
      ];
    }

    return [];
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const response = await fetchApi(this.site + novelPath);
    const body = await response.text();
    const $ = parseHTML(body);

    const chapters: Plugin.ChapterItem[] = [];

    // Every <details> block on the site's table of contents is a Part.
    // LNReader currently exposes chapters as one flat array, so the Part
    // name is preserved in each chapter title as "[Part X]".
    $('details').each((_, details) => {
      const partName = $(details).find('summary').first().text().trim();

      if (!partName) {
        return;
      }

      $(details)
        .find('p a')
        .each((_, element) => {
          const path = $(element).attr('href');
          const name = $(element).text().trim();

          if (!path || !name) {
            return;
          }

          const chapterNumberMatch = name.match(/Chapter\s+(\d+)/i);
          const chapterNumber = chapterNumberMatch
            ? Number(chapterNumberMatch[1])
            : undefined;

          const dateMatch = path.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
          const releaseTime = dateMatch
            ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
            : '';

          chapters.push({
            name: `[${partName}] ${name}`,
            path,
            releaseTime,
            chapterNumber,
            scanlator: 'Sads Translates',
          });
        });
    });

    return {
      path: novelPath,
      name: 'Breakthrough with the Forbidden Master',
      author: 'Anikki Burazza',
      cover:
        'https://sadstranslates.page/wp-content/uploads/2019/11/818ay2fgbal._ac_sl1500_.jpg?w=720',
      genres:
        'Action, Fantasy, Romance, Comedy, Supernatural, School, Magic',
      status: NovelStatus.Ongoing,
      summary:
        'Earth, the son of a hero who saved the world, becomes the Demon King’s disciple after discovering the Demon King sealed within his father’s sword.',
      chapters,
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const response = await fetchApi(chapterPath);
    const body = await response.text();
    const $ = parseHTML(body);

    const content = $('div.entry-content').first();

    if (!content.length) {
      return '<p>Chapter content could not be found.</p>';
    }

    const output: string[] = [];
    let reachedNotes = false;

    content.children().each((_, element) => {
      const tagName = element.tagName?.toLowerCase();

      // The translator notes begin after the horizontal rule.
      if (tagName === 'hr') {
        reachedNotes = true;
        return false;
      }

      if (
        !reachedNotes &&
        tagName === 'p' &&
        $(element).hasClass('wp-block-paragraph')
      ) {
        const html = $(element).html();

        if (html && html.trim()) {
          output.push(`<p>${html.trim()}</p>`);
        }
      }
    });

    return output.join('\n');
  }

  resolveUrl = (path: string, isNovel?: boolean) => {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return this.site + path;
  };
}

export default new SadsForbiddenMaster();
