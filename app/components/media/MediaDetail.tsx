import { useEffect, useState } from 'react';
import { Avatar } from '@nextui-org/avatar';
import { Button } from '@nextui-org/button';
import { Card, CardBody } from '@nextui-org/card';
import { Chip } from '@nextui-org/chip';
import { Tooltip } from '@nextui-org/react';
import { Spacer } from '@nextui-org/spacer';
import { useMeasure, useMediaQuery } from '@react-hookz/web';
import { useFetcher, useLocation, useNavigate } from '@remix-run/react';
import { motion, useTransform } from 'framer-motion';
import { MimeType } from 'remix-image';
// import { useTranslation } from 'react-i18next';
import { tv } from 'tailwind-variants';
import tinycolor from 'tinycolor2';
import type { ColorPalette } from '~/routes/api/color-palette';

import type { IAnimeInfo } from '~/services/consumet/anilist/anilist.types';
import type { IMovieDetail, IMovieTranslations, ITvShowDetail } from '~/services/tmdb/tmdb.types';
import { WebShareLink } from '~/utils/client/pwa-utils.client';
import TMDB from '~/utils/media';
import { useLayout } from '~/store/layout/useLayout';
import useColorDarkenLighten from '~/hooks/useColorDarkenLighten';
import { useSoraSettings } from '~/hooks/useLocalStorage';
import Image from '~/components/elements/Image';
import SelectProviderModal from '~/components/elements/dialog/SelectProviderModal';
import Rating from '~/components/elements/shared/Rating';
import { backgroundStyles } from '~/components/styles/primitives';
import PhotoIcon from '~/assets/icons/PhotoIcon';
import ShareIcon from '~/assets/icons/ShareIcon';

interface IMediaDetail {
  type: 'movie' | 'tv';
  item: IMovieDetail | ITvShowDetail | undefined;
  handler?: (id: number) => void;
  translations?: IMovieTranslations | undefined;
  imdbRating: { count: number; star: number } | undefined;
  color: string | undefined;
}

interface IMediaBackground {
  backdropPath: string | undefined;
  backgroundColor: string;
}

interface IAnimeDetail {
  item: IAnimeInfo | undefined;
  handler?: (id: number) => void;
}

const backgroundImageStyles = tv({
  base: 'relative w-full overflow-hidden bg-fixed bg-[left_0px_top_0px] bg-no-repeat',
  variants: {
    sidebarMiniMode: {
      true: 'sm:bg-[left_80px_top_0px]',
    },
    sidebarBoxedMode: {
      true: 'sm:bg-[left_280px_top_0px]',
    },
  },
  compoundVariants: [
    {
      sidebarMiniMode: true,
      sidebarBoxedMode: true,
      class: 'sm:bg-[left_110px_top_0px]',
    },
    {
      sidebarMiniMode: false,
      sidebarBoxedMode: false,
      class: 'sm:bg-[left_250px_top_0px]',
    },
  ],
});

export const MediaDetail = (props: IMediaDetail) => {
  // const { t } = useTranslation();
  const { type, item, handler, imdbRating, color } = props;
  const [size, ref] = useMeasure<HTMLDivElement>();
  const [imageSize, imageRef] = useMeasure<HTMLDivElement>();
  const navigate = useNavigate();
  const location = useLocation();
  const fetcher = useFetcher();
  const { backgroundColor } = useColorDarkenLighten(color);
  const isSm = useMediaQuery('(max-width: 650px)', { initializeWithValue: false });
  const isXl = useMediaQuery('(max-width: 1280px)', { initializeWithValue: false });
  const [visible, setVisible] = useState(false);
  const [colorPalette, setColorPalette] = useState<ColorPalette>();
  const closeHandler = () => {
    setVisible(false);
  };
  const { id, tagline, genres, status } = item || {};
  const title = (item as IMovieDetail)?.title || (item as ITvShowDetail)?.name || '';
  const titleEng = (item as IMovieDetail)?.titleEng || (item as ITvShowDetail)?.nameEng || '';
  const orgTitle =
    (item as IMovieDetail)?.original_title || (item as ITvShowDetail)?.original_name || '';
  const runtime =
    // @ts-ignore
    Number((item as IMovieDetail)?.runtime) ?? Number((item as ITvShowDetail)?.episode_run_time[0]);
  const posterPath = item?.poster_path
    ? TMDB?.posterUrl(item?.poster_path || '', 'w342')
    : undefined;
  const releaseYear = new Date(
    (item as IMovieDetail)?.release_date ?? ((item as ITvShowDetail)?.first_air_date || ''),
  ).getFullYear();
  const releaseDate = new Date(
    (item as IMovieDetail)?.release_date ?? ((item as ITvShowDetail)?.first_air_date || ''),
  ).toLocaleDateString('fr-FR');
  const description = (item as IMovieDetail)?.overview || (item as ITvShowDetail)?.overview || '';

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({
        behavior: 'instant',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [ref, location.pathname]);

  useEffect(() => {
    if (color?.startsWith('#')) {
      fetcher.load(`/api/color-palette?color=${color.replace('#', '')}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  useEffect(() => {
    if (fetcher.data && fetcher.data.color) {
      setColorPalette(fetcher.data.color);
    }
  }, [fetcher.data]);

  return (
    <>
      <Card
        radius="none"
        style={{
          height: `calc(${size?.height}px)`,
          // @ts-ignore
          '--colors-movie-brand': backgroundColor,
        }}
        classNames={{
          base: 'flex flex-col w-full !bg-transparent bg-gradient-to-b !from-transparent from-[80px] !to-movie-brand-color border-0 to-[80px] sm:from-[200px] sm:to-[200px]',
        }}
      >
        <CardBody
          ref={ref}
          className="z-1 absolute bottom-0 flex grow flex-col items-center justify-center p-0"
        >
          <div className={backgroundStyles({ content: true })} />
          <div className="grid w-full max-w-[1920px] grid-cols-[1fr_2fr] grid-rows-[1fr_auto_auto] items-stretch justify-center gap-x-4 gap-y-6 px-3 pt-5 grid-areas-small sm:grid-rows-[auto_1fr_auto] sm:px-3.5 sm:grid-areas-wide xl:px-4 2xl:px-5">
            <div className="flex flex-col items-center justify-center grid-in-image" ref={imageRef}>
              {posterPath ? (
                <div className="w-full sm:w-3/4 xl:w-1/2">
                  <Image
                    src={posterPath}
                    alt={title}
                    radius="xl"
                    shadow="xl"
                    className="aspect-[2/3] !min-h-[auto] !min-w-[auto]"
                    disableSkeleton={false}
                    loaderUrl="/api/image"
                    placeholder="empty"
                    responsive={[
                      {
                        size: {
                          width: Math.round(
                            (imageSize?.width || 0) *
                              (!isXl && !isSm ? 0.5 : isXl && !isSm ? 0.75 : isXl && isSm ? 1 : 1),
                          ),
                          height: Math.round(
                            ((imageSize?.width || 0) *
                              3 *
                              (!isXl && !isSm
                                ? 0.5
                                : isXl && !isSm
                                ? 0.75
                                : isXl && isSm
                                ? 1
                                : 1)) /
                              2,
                          ),
                        },
                      },
                    ]}
                    options={{
                      contentType: MimeType.WEBP,
                    }}
                  />
                </div>
              ) : (
                <div className="flex w-full items-center justify-center">
                  <Avatar
                    icon={<PhotoIcon width={48} height={48} />}
                    radius="xl"
                    classNames={{
                      base: 'w-full h-auto aspect-[2/3] sm:w-3/4 xl:w-1/2',
                    }}
                  />
                </div>
              )}
              {isSm ? null : <Spacer y={10} />}
            </div>
            <div className="flex w-full flex-col items-start justify-start grid-in-title">
              <h1 className="!text-3xl md:!text-4xl">
                {`${title}${isSm ? '' : ` (${releaseYear})`}`}
              </h1>
              {tagline ? <p className="italic">{tagline}</p> : null}
            </div>
            <div className="flex flex-col gap-y-3 grid-in-info sm:gap-y-6">
              <div className="flex flex-row flex-wrap gap-3">
                <Chip
                  size="xl"
                  color="primary"
                  radius="full"
                  variant="flat"
                  style={
                    colorPalette
                      ? {
                          backgroundColor: colorPalette[200],
                          borderColor: colorPalette[400],
                        }
                      : { borderColor: '$primaryLightActive' }
                  }
                  classNames={{
                    base: 'duration-200 ease-in-out transition-all',
                    content: 'flex flex-row items-center gap-x-2',
                  }}
                >
                  <Rating
                    rating={item?.vote_average?.toFixed(1)}
                    ratingType="movie"
                    color={colorPalette ? colorPalette[600] : undefined}
                  />
                  {imdbRating ? (
                    <div className="ml-3 flex flex-row items-center gap-x-2">
                      <h6 className="rounded-xl bg-[#ddb600] px-1 text-black">IMDb</h6>
                      <h6 style={colorPalette ? { color: colorPalette[600] } : {}}>
                        {imdbRating?.star}
                      </h6>
                    </div>
                  ) : null}
                </Chip>
                <Chip
                  size="xl"
                  color="primary"
                  radius="full"
                  variant="flat"
                  className="flex flex-row duration-200 ease-in-out transition-all"
                  style={
                    colorPalette
                      ? {
                          backgroundColor: colorPalette[200],
                          borderColor: colorPalette[400],
                        }
                      : { borderColor: '$primaryLightActive' }
                  }
                >
                  <h6 style={colorPalette ? { color: colorPalette[600] } : {}}>
                    {releaseDate}
                    {runtime ? ` • ${Math.floor(runtime / 60)}h ${runtime % 60}m` : null}
                  </h6>
                </Chip>
              </div>
              <div className="flex w-full flex-row flex-wrap items-center justify-start gap-3">
                {genres &&
                  genres?.map((genre) => (
                    <Button
                      type="button"
                      variant="flat"
                      key={genre?.id}
                      size={isSm ? 'sm' : 'md'}
                      className="hover:opacity-80"
                      style={{
                        transition: 'all 0.2s ease-in-out',
                        ...(colorPalette
                          ? {
                              color: colorPalette[600],
                              backgroundColor: colorPalette[200],
                            }
                          : {}),
                      }}
                      onPress={() =>
                        navigate(
                          `/discover/${type === 'movie' ? 'movies' : 'tv-shows'}?with_genres=${
                            genre?.id
                          }`,
                        )
                      }
                    >
                      {genre?.name}
                    </Button>
                  ))}
              </div>
            </div>
            <div className="mb-10 flex w-full flex-row flex-wrap items-center justify-between gap-4 grid-in-buttons">
              {(status === 'Released' || status === 'Ended' || status === 'Returning Series') && (
                <Button
                  type="button"
                  // shadow
                  onPress={() => setVisible(true)}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-lg font-bold sm:w-auto"
                  size="lg"
                >
                  Watch now
                </Button>
              )}
              <div className="flex flex-row flex-wrap items-center justify-start gap-x-4">
                <Button
                  type="button"
                  size={isSm ? 'sm' : 'md'}
                  onPress={() => handler && handler(Number(id))}
                >
                  Watch Trailer
                </Button>
                <Tooltip content="Share" placement="top" isDisabled={isSm}>
                  <Button
                    type="button"
                    size={isSm ? 'sm' : 'md'}
                    onPress={() => WebShareLink(window.location.href, `${title}`, `${description}`)}
                    isIconOnly
                  >
                    <ShareIcon />
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      <SelectProviderModal
        visible={visible}
        closeHandler={closeHandler}
        type={type}
        title={titleEng}
        origTitle={orgTitle}
        year={releaseYear}
        id={item?.id}
        {...(type === 'tv' && { season: 1, episode: 1, isEnded: status === 'Ended' })}
        {...(type === 'movie' && { isEnded: status === 'Released' })}
      />
    </>
  );
};

export const AnimeDetail = (props: IAnimeDetail) => {
  // const { t } = useTranslation();
  const { item, handler } = props;
  const { id, genres, title, releaseDate, rating, image, type, color, description, status } =
    item || {};
  const navigate = useNavigate();
  const location = useLocation();
  const fetcher = useFetcher();
  const [size, ref] = useMeasure<HTMLDivElement>();
  const [imageSize, imageRef] = useMeasure<HTMLDivElement>();
  const { backgroundColor } = useColorDarkenLighten(color);
  const isSm = useMediaQuery('(max-width: 650px)', { initializeWithValue: false });
  const isXl = useMediaQuery('(max-width: 1280px)', { initializeWithValue: false });
  const [visible, setVisible] = useState(false);
  const [colorPalette, setColorPalette] = useState<ColorPalette>();
  const closeHandler = () => {
    setVisible(false);
  };

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });
    }
  }, [ref, location.pathname]);

  useEffect(() => {
    if (color?.startsWith('#')) {
      fetcher.load(`/api/color-palette?color=${color.replace('#', '')}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  useEffect(() => {
    if (fetcher.data && fetcher.data.color) {
      setColorPalette(fetcher.data.color);
    }
  }, [fetcher.data]);

  return (
    <>
      <Card
        radius="none"
        style={{
          height: `calc(${size?.height}px)`,
          // @ts-ignore
          '--colors-movie-brand': backgroundColor,
        }}
        classNames={{
          base: 'flex flex-col w-full !bg-transparent bg-gradient-to-b !from-transparent from-[80px] !to-movie-brand-color border-0 to-[80px] sm:from-[200px] sm:to-[200px]',
        }}
      >
        <CardBody ref={ref} className="z-1 absolute bottom-0 flex grow flex-col justify-center p-0">
          <div className={backgroundStyles({ content: true })} />
          <div className="grid w-full max-w-[1920px] grid-cols-[1fr_2fr] grid-rows-[1fr_auto_auto] items-stretch justify-center gap-x-4 gap-y-6 px-3 pt-5 grid-areas-small sm:grid-rows-[auto_1fr_auto] sm:px-3.5 sm:grid-areas-wide xl:px-4 2xl:px-5">
            <div className="flex flex-col items-center justify-center grid-in-image" ref={imageRef}>
              {image ? (
                <div className="w-full sm:w-3/4 xl:w-1/2">
                  <Image
                    src={image}
                    title={title?.userPreferred || title?.english || title?.romaji || title?.native}
                    alt={title?.userPreferred || title?.english || title?.romaji || title?.native}
                    radius="xl"
                    className="aspect-[2/3] !min-h-[auto] !min-w-[auto]"
                    disableSkeleton={false}
                    loaderUrl="/api/image"
                    placeholder="empty"
                    responsive={[
                      {
                        size: {
                          width: Math.round(
                            (imageSize?.width || 0) *
                              (!isXl && !isSm ? 0.5 : isXl && !isSm ? 0.75 : isXl && isSm ? 1 : 1),
                          ),
                          height: Math.round(
                            ((imageSize?.width || 0) *
                              3 *
                              (!isXl && !isSm
                                ? 0.5
                                : isXl && !isSm
                                ? 0.75
                                : isXl && isSm
                                ? 1
                                : 1)) /
                              2,
                          ),
                        },
                      },
                    ]}
                    options={{
                      contentType: MimeType.WEBP,
                    }}
                  />
                </div>
              ) : (
                <div className="flex w-full items-center justify-center">
                  <Avatar
                    icon={<PhotoIcon width={48} height={48} />}
                    radius="xl"
                    classNames={{
                      base: 'w-full h-auto aspect-[2/3] sm:w-3/4 xl:w-1/2',
                    }}
                  />
                </div>
              )}
              {isSm ? null : <Spacer y={10} />}
            </div>
            <div className="flex w-full flex-col items-start justify-start grid-in-title">
              <h1 className="!text-3xl md:!text-4xl">
                {`${title?.userPreferred || title?.english || title?.romaji || title?.native}`}
              </h1>
            </div>
            <div className="flex flex-col gap-y-3 grid-in-info sm:gap-y-6">
              <div className="flex flex-row flex-wrap gap-3">
                <Chip
                  size="xl"
                  color="primary"
                  radius="full"
                  variant="flat"
                  className="duration-200 ease-in-out transition-all"
                  style={
                    colorPalette
                      ? {
                          backgroundColor: colorPalette[200],
                          borderColor: colorPalette[400],
                        }
                      : { borderColor: '$primaryLightActive' }
                  }
                >
                  <Rating
                    rating={rating}
                    ratingType="anime"
                    color={colorPalette ? colorPalette[600] : undefined}
                  />
                </Chip>
                <Chip
                  size="xl"
                  color="primary"
                  radius="full"
                  variant="flat"
                  className="flex flex-row duration-200 ease-in-out transition-all"
                  style={
                    colorPalette
                      ? {
                          backgroundColor: colorPalette[200],
                          borderColor: colorPalette[400],
                        }
                      : { borderColor: '$primaryLightActive' }
                  }
                >
                  <h6 style={colorPalette ? { color: colorPalette[600] } : {}}>
                    {type}
                    {releaseDate ? ` • ${releaseDate}` : ''}
                  </h6>
                </Chip>
              </div>
              <div className="flex w-full flex-row flex-wrap items-center justify-start gap-3">
                {genres &&
                  genres?.map((genre) => (
                    <Button
                      type="button"
                      variant="flat"
                      key={genre}
                      size={isSm ? 'sm' : 'md'}
                      className="hover:opacity-80"
                      style={{
                        transition: 'all 0.2s ease-in-out',
                        ...(colorPalette
                          ? {
                              color: colorPalette[600],
                              backgroundColor: colorPalette[200],
                            }
                          : {}),
                      }}
                      onPress={() => navigate(`/discover/anime?genres=${genre}`)}
                    >
                      {genre}
                    </Button>
                  ))}
              </div>
            </div>
            <div className="mb-10 flex w-full flex-row flex-wrap items-center justify-between gap-4 grid-in-buttons">
              <Button
                type="button"
                onPress={() => setVisible(true)}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-secondary text-lg font-bold sm:w-auto"
              >
                Watch now
              </Button>
              <div className="flex flex-row flex-wrap items-center justify-start gap-x-4">
                <Button
                  type="button"
                  size={isSm ? 'sm' : 'md'}
                  onPress={() => handler && handler(Number(id))}
                >
                  Watch Trailer
                </Button>
                <Tooltip content="Share" placement="top" isDisabled={isSm}>
                  <Button
                    type="button"
                    size={isSm ? 'sm' : 'md'}
                    onPress={() => WebShareLink(window.location.href, `${title}`, `${description}`)}
                    isIconOnly
                  >
                    <ShareIcon />
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      <SelectProviderModal
        visible={visible}
        closeHandler={closeHandler}
        type="anime"
        id={id}
        title={title?.english || ''}
        origTitle={title?.native || ''}
        year={Number(releaseDate)}
        episode={1}
        season={undefined}
        animeType={type?.toLowerCase() || 'tv'}
        isEnded={status === 'FINISHED'}
      />
    </>
  );
};

export const MediaBackgroundImage = (props: IMediaBackground) => {
  const { backdropPath, backgroundColor } = props;
  const [size, backgroundRef] = useMeasure<HTMLDivElement>();
  const isSm = useMediaQuery('(max-width: 650px)', { initializeWithValue: false });
  const { sidebarMiniMode, sidebarBoxedMode } = useSoraSettings();
  const { scrollY } = useLayout((scrollState) => scrollState);
  const backgroundImageHeight = isSm ? 100 : 300;
  const height = useTransform(
    scrollY,
    [0, 800 - backgroundImageHeight],
    [backgroundImageHeight, 800],
  );
  return (
    <div
      ref={backgroundRef}
      className={backgroundImageStyles({
        sidebarMiniMode: sidebarMiniMode.value,
        sidebarBoxedMode: sidebarBoxedMode.value,
      })}
      style={{
        backgroundImage: `url(${
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : 'https://sora-anime.vercel.app'
        }/api/image?src=${encodeURIComponent(
          backdropPath ||
            'https://raw.githubusercontent.com/Khanhtran47/Sora/master/app/assets/images/background-default.jpg',
        )}&width=${size?.width}&height=${
          size?.height
        }&fit=cover&position=center&background[]=0&background[]=0&background[]=0&background[]=0&quality=80&compressionLevel=9&loop=0&delay=100&crop=null&contentType=image%2Fwebp)`,
        aspectRatio: '2 / 1',
        visibility: size?.width !== undefined ? 'visible' : 'hidden',
        backgroundSize: `${size?.width}px auto`,
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          height,
          backgroundImage: `linear-gradient(to top, ${backgroundColor}, ${tinycolor(
            backgroundColor,
          ).setAlpha(0)})`,
        }}
      />
    </div>
  );
};
